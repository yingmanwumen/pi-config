---
description: Review, commit, and push changes
---

Review all tracked and untracked changes with git.

Flag an issue only when all of these are true:

- It affects correctness, security, performance, or maintainability in a meaningful way.
- It is discrete and actionable.
- It was introduced by the reviewed change.
- The affected scenario or call path can be demonstrated from the code.
- The author would probably fix it if they knew about it.

Do not invent a finding to fill the result. If issues are found, collect them into a list and then report it, ask the user how to proceed, and stop. After that, continue or restart this review routine.

If clean, split unrelated changes into atomic commits, ask the user question with the question tool for confirmation(single commit or atomic commits or ?), then commit each with a concise English Conventional Commit message and push to its upstream branch.
