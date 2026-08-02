import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const schema = Type.Object({
  patch: Type.String({ description: "An OpenCode-compatible patch beginning with *** Begin Patch and ending with *** End Patch" }),
});

type Input = { patch: string };

function targetPath(name: string): string {
  return resolve(process.cwd(), name);
}

async function applyFilePatch(header: string, body: string): Promise<string> {
  const match = header.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
  if (!match) throw new Error(`Invalid file header: ${header}`);
  const [, operation, name] = match;
  const path = targetPath(name.trim());

  if (operation === "Add") {
    const content = body.split("\n").filter((line) => line.startsWith("+")).map((line) => line.slice(1)).join("\n");
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content + (content ? "\n" : ""));
    return `added ${name.trim()}`;
  }
  if (operation === "Delete") {
    await unlink(path);
    return `deleted ${name.trim()}`;
  }

  const original = await readFile(path, "utf8");
  let lines = original.replace(/\r\n/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  const hunks = body.split("\n*** ").map((part, i) => i ? "*** " + part : part).filter((part) => part.startsWith("@@"));
  for (const hunk of hunks) {
    const hunkLines = hunk.split("\n").slice(1);
    const oldLines = hunkLines.filter((l) => l.startsWith(" ") || l.startsWith("-")).map((l) => l.slice(1));
    const additions = hunkLines.filter((l) => l.startsWith(" ") || l.startsWith("+")).map((l) => l.slice(1));
    let found = -1;
    for (let i = 0; i <= lines.length - oldLines.length; i++) {
      if (oldLines.every((line, j) => lines[i + j] === line)) { found = i; break; }
    }
    if (found < 0) throw new Error(`Hunk does not apply to ${name.trim()}`);
    lines.splice(found, oldLines.length, ...additions);
  }
  await writeFile(path, lines.join("\n") + "\n");
  return `updated ${name.trim()}`;
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "apply_patch",
    label: "Apply Patch",
    description: "Apply an OpenCode-compatible *** Begin Patch patch. Creates parent directories and new files automatically.",
    parameters: schema,
    async execute(_id, params: Input) {
      const patch = params.patch.trim();
      if (!patch.startsWith("*** Begin Patch") || !patch.endsWith("*** End Patch")) {
        throw new Error("Patch must use OpenCode format with *** Begin Patch and *** End Patch");
      }
      const sections = patch.slice("*** Begin Patch".length, -"*** End Patch".length)
        .trim().split(/(?=\*\*\* (?:Add|Update|Delete) File: )/).filter(Boolean);
      const results: string[] = [];
      for (const section of sections) {
        const firstNewline = section.indexOf("\n");
        results.push(await applyFilePatch(section.slice(0, firstNewline).trim(), section.slice(firstNewline + 1)));
      }
      return { content: [{ type: "text", text: results.join("\n") }], details: {} };
    },
  });
}
