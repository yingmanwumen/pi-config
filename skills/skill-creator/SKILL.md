---
name: skill-creator
description: Create or improve OpenCode agent skills with valid SKILL.md metadata, concise instructions, progressive-disclosure references, and practical validation. Use when designing, migrating, or repairing a skill for OpenCode.
license: MIT
compatibility: opencode
metadata:
  workflow: skill-development
  format: markdown
---

# OpenCode Skill Creator

Use this workflow when creating or updating a skill under `.opencode/skills/` or `~/.config/opencode/skills/`.

## Skill structure

Each skill is a directory containing an uppercase `SKILL.md`:

```text
skill-name/
├── SKILL.md
└── references/       # optional, loaded only when needed
```

Use scripts or assets only when they directly support the workflow. Do not add README, changelog, installation, or process-history files to the skill.

## Required frontmatter

OpenCode recognizes only these frontmatter fields:

- `name` (required)
- `description` (required)
- `license` (optional)
- `compatibility` (optional)
- `metadata` (optional string-to-string mapping)

The `name` must match the directory name, be 1–64 characters, use lowercase letters/digits with single hyphens, and match:

```text
^[a-z0-9]+(-[a-z0-9]+)*$
```

Keep `description` specific enough to trigger the skill correctly and between 1 and 1024 characters.

## Design workflow

1. Define concrete requests the skill should handle and requests it should not handle.
2. Identify the tools, files, APIs, permissions, and environment variables it actually needs.
3. Inspect any existing skill and preserve unrelated user changes.
4. Keep `SKILL.md` focused on triggering, core rules, workflow selection, safety, and links to references.
5. Move detailed schemas, templates, examples, API procedures, and variants into one-level-deep `references/` files.
6. Choose the least ambiguous instructions for fragile operations and leave judgment to the agent where several valid approaches exist.
7. Implement the skill and validate it against realistic requests and failure cases.

## Progressive disclosure

The agent sees the skill name and description first, then loads `SKILL.md` when selected. References are loaded only when the task needs them. Keep the main file concise and preferably below 500 lines. Every reference must be linked directly from `SKILL.md`; avoid chains of references.

Use a routing table when the skill has multiple workflows:

```markdown
| Task | Reference |
| --- | --- |
| Specific variant | [variant.md](references/variant.md) |
```

Avoid duplicating the same rule in both the main file and a reference. Keep universal safety rules in `SKILL.md`; keep variant-specific detail in references.

## Validation checklist

Before handoff, verify:

```bash
skill_dir="$HOME/.config/opencode/skills/<name>"
test -f "$skill_dir/SKILL.md"
rg -n '^name:|^description:' "$skill_dir/SKILL.md"
rg -o 'references/[A-Za-z0-9._-]+\.md' "$skill_dir/SKILL.md"
```

Then confirm that every referenced file exists, the frontmatter parses as YAML, the directory and `name` match, no secret or credential is embedded, and the workflow does not assume unavailable tools. Test both a normal request and an error case such as missing credentials, ambiguous target, or conflicting input.

## Safety rules

- Do not expose tokens, credentials, private paths, or user data in skill content.
- Do not silently broaden a write operation beyond the user's requested scope.
- Preserve existing files and unrelated changes.
- Ask before destructive or externally visible actions when authorization is unclear.
- Report unsupported integrations and provide a practical fallback.
