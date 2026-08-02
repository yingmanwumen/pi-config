import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Key } from "@earendil-works/pi-tui";

export default function (pi: ExtensionAPI) {
  let planMode = false;
  let savedTools: string[] | undefined;

  function setStatus(ctx: ExtensionContext) {
    ctx.ui.setStatus("plan-build-mode", planMode ? ctx.ui.theme.fg("warning", "plan") : ctx.ui.theme.fg("success", "build"));
  }

  function toggle(ctx: ExtensionContext) {
    planMode = !planMode;
    if (planMode) {
      savedTools = pi.getActiveTools();
      pi.setActiveTools(savedTools.filter((name) => name !== "edit" && name !== "write"));
      ctx.ui.notify("已切换到 plan 模式：禁止以任何形式修改当前项目文件。", "warning");
    } else {
      pi.setActiveTools(savedTools ?? pi.getActiveTools());
      savedTools = undefined;
      ctx.ui.notify("已切换到 build 模式。", "info");
    }
    setStatus(ctx);
  }

  pi.registerShortcut(Key.tab, {
    description: "Toggle plan/build mode",
    handler: async (ctx) => toggle(ctx),
  });

  pi.registerCommand("plan", {
    description: "Toggle plan/build mode",
    handler: async (_args, ctx) => toggle(ctx),
  });

  pi.on("tool_call", async (event) => {
    if (!planMode) return;
    if (event.toolName === "edit" || event.toolName === "write") {
      return { block: true, reason: "plan 模式禁止修改当前项目文件。" };
    }
    if (event.toolName === "bash") {
      return { block: true, reason: "plan 模式禁止执行可能修改文件的 bash 命令。" };
    }
  });

  pi.on("before_agent_start", async () => {
    if (!planMode) return;
    return {
      systemPrompt: "你现在在plan模式，禁止以任何形式修改当前项目文件。",
    };
  });

  pi.on("session_start", async (_event, ctx) => setStatus(ctx));
}
