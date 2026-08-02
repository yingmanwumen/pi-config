import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Key } from "@earendil-works/pi-tui";

export default function (pi: ExtensionAPI) {
  let planMode = false;

  function updateStatus(ctx: ExtensionContext) {
    ctx.ui.setStatus(
      "plan-build-mode",
      planMode
        ? ctx.ui.theme.fg("warning", "plan")
        : ctx.ui.theme.fg("success", "build"),
    );
  }

  function toggle(ctx: ExtensionContext) {
    planMode = !planMode;
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
  pi.on("before_agent_start", async (event) => {
    if (planMode) {
      return {
        systemPrompt:
          event.systemPrompt +
          "\n\nYou are currently in plan mode. You're not allowed do implement changes now.\n",
      };
    } else {
      return {
        systemPrompt:
          event.systemPrompt +
          "\n\nYou are currently in build mode. You're allowed to implement changes now.\n",
      };
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    // These tools are never exposed to the model in either mode.
    pi.setActiveTools(
      pi
        .getActiveTools()
        .filter(
          (name) =>
            name !== "read" && name !== "write" && name !== "edit",
        ),
    );
    updateStatus(ctx);
  });
}
