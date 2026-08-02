---
name: notion
description: Work with Notion through the REST API using NOTION_TOKEN to search, read, create, and update pages, databases, meeting documents, research briefs, and implementation plans.
metadata:
  short-description: Use Notion through its REST API
---

# Notion Workflows

## Tooling

Use the Notion REST API with `curl` and the `NOTION_TOKEN` environment variable. Never print, log, or write the token to files. Use `Notion-Version: 2022-06-28` unless the workspace requires a newer compatible version.

Before any request, verify `NOTION_TOKEN` is set. Use `https://api.notion.com/v1` and preserve the response JSON for parsing without exposing authorization headers.

Read-only endpoints include `/search`, `/pages/{page_id}`, `/blocks/{block_id}/children`, `/databases/{database_id}`, and `/databases/{database_id}/query`. Treat page, database, and data-source IDs as user-provided or discovered identifiers; do not guess them.

## Workflow routing

Read only the reference needed for the task:

| Task | Reference |
| --- | --- |
| Capture a conversation, decision, FAQ, or how-to | [knowledge-capture.md](references/knowledge-capture.md) |
| Prepare a meeting agenda or pre-read | [meeting-intelligence.md](references/meeting-intelligence.md) |
| Research Notion sources and publish a brief/report | [research-documentation.md](references/research-documentation.md) |
| Turn a spec into a plan, tasks, and tracking | [spec-to-implementation.md](references/spec-to-implementation.md) |

## Safety and source discipline

- Search and fetch before editing an existing page.
- Confirm the target page/database and intended scope before writes.
- Preserve existing content and properties unless the user asks to replace them.
- Ask before creating many pages, changing permissions, or modifying shared source material.
- Cite source page URLs or IDs in generated documents and distinguish facts from assumptions.
- If an API response is `401`, report authentication failure; for `403`, report missing integration access; for `404`, verify the ID and sharing; for `429`, respect `Retry-After`.

## API patterns

```bash
# Authentication check
curl -sS -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H 'Notion-Version: 2022-06-28' \
  https://api.notion.com/v1/users/me

# Search one literal query
curl -sS -X POST https://api.notion.com/v1/search \
  -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H 'Notion-Version: 2022-06-28' \
  -H 'Content-Type: application/json' \
  --data '{"query":"project spec","page_size":20}'
```

Paginate using `has_more` and `next_cursor`. Read block children recursively when a page's content is needed. For writes, use explicit JSON request bodies and verify the resulting page after creation or update.
