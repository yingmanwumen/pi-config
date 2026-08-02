import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event) => {
    if (event.toolName === "read" || event.toolName === "write") {
      return {
        block: true,
        reason: `The ${event.toolName} tool is disabled by user configuration.`,
      };
    }
  });
}
