import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const schema = Type.Object({
  patch: Type.String({ description: "An OpenCode-compatible patch beginning with *** Begin Patch and ending with *** End Patch" }),
});
type Input = { patch: string };
function targetPath(name: string): string { return resolve(process.cwd(), name); }

type Operation = { path: string; kind: "Add" | "Update" | "Delete"; content?: string };

function parseHunks(body: string): string[][] {
  return body.split(/(?=^@@)/m).filter(p => p.startsWith("@@"))
    .map(h => h.split("\n").slice(1));
}

async function prepareFile(header: string, body: string): Promise<Operation> {
  const match = header.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
  if (!match) throw new Error(`Invalid file header: ${header}`);
  const kind = match[1] as Operation["kind"];
  const name = match[2].trim();
  const path = targetPath(name);
  if (kind === "Add") {
    const lines = body.split("\n").filter(Boolean);
    if (lines.some(l => !l.startsWith("+"))) throw new Error(`Invalid Add File patch for ${name}`);
    return { path, kind, content: lines.map(l => l.slice(1)).join("\n") + (lines.length ? "\n" : "") };
  }
  const original = await readFile(path, "utf8");
  if (kind === "Delete") return { path, kind };
  let lines = original.replace(/\r\n/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  for (const hunk of parseHunks(body)) {
    const oldLines = hunk.filter(l => l.startsWith(" ") || l.startsWith("-")).map(l => l.slice(1));
    const additions = hunk.filter(l => l.startsWith(" ") || l.startsWith("+")).map(l => l.slice(1));
    const found = lines.findIndex((_, i) => oldLines.every((line, j) => lines[i + j] === line));
    if (found < 0) throw new Error(`Hunk does not apply to ${name}`);
    lines.splice(found, oldLines.length, ...additions);
  }
  return { path, kind, content: lines.join("\n") + "\n" };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "apply_patch", label: "Apply Patch",
    description: "Apply an OpenCode-compatible *** Begin Patch patch atomically. Creates parent directories and new files automatically.",
    parameters: schema,
    async execute(_id, params: Input) {
      const patch = params.patch.trim();
      if (!patch.startsWith("*** Begin Patch") || !patch.endsWith("*** End Patch")) throw new Error("Patch must use OpenCode format with *** Begin Patch and *** End Patch");
      const inner = patch.slice("*** Begin Patch".length, -"*** End Patch".length).trim();
      const sections = inner.split(/(?=^\*\*\* (?:Add|Update|Delete) File: )/m).filter(Boolean);
      if (!sections.length) throw new Error("Patch contains no file operations");
      const operations: Operation[] = [];
      for (const section of sections) {
        const newline = section.indexOf("\n");
        if (newline < 0) throw new Error(`Missing patch body: ${section}`);
        operations.push(await prepareFile(section.slice(0, newline).trim(), section.slice(newline + 1)));
      }
      // No filesystem writes occurred above. Commit only after every file validates.
      for (const op of operations) {
        if (op.kind === "Delete") await unlink(op.path);
        else { await mkdir(dirname(op.path), { recursive: true }); await writeFile(op.path, op.content!); }
      }
      return { content: [{ type: "text", text: operations.map(o => `${o.kind === "Add" ? "added" : o.kind === "Delete" ? "deleted" : "updated"} ${o.path}`).join("\n") }], details: {} };
    },
  });
}
