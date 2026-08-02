import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Key } from "@earendil-works/pi-tui";

export default function (pi: ExtensionAPI) {
  let planMode = false;

  // These tools are never exposed to the model in either mode.
  pi.setActiveTools(pi.getActiveTools().filter((name) => name !== "read" && name !== "write"));

  function updateStatus(ctx: ExtensionContext) {
    ctx.ui.setStatus(
      "plan-build-mode",
      planMode ? ctx.ui.theme.fg("warning", "plan") : ctx.ui.theme.fg("success", "build"),
    );
  }

  function toggle(ctx: ExtensionContext) {
    planMode = !planMode;
    ctx.ui.notify(planMode ? "已切换到 plan 模式。" : "已切换到 build 模式。", "info");
    updateStatus(ctx);
  }

  pi.registerShortcut(Key.tab, {
    description: "Toggle plan/build mode",
    handler: async (ctx) => toggle(ctx),
  });

  pi.registerCommand("plan", {
    description: "Toggle plan/build mode",
    handler: async (_args, ctx) => toggle(ctx),
  });

  // Plan mode only changes the instruction; it does not disable tools.
  pi.on("before_agent_start", async () => {
    if (!planMode) return;
    return {
      systemPrompt: "你现在在plan模式。先分析并提出计划，不要执行实现；等待用户确认后再继续。",
    };
  });

  pi.on("session_start", async (_event, ctx) => updateStatus(ctx));
}
