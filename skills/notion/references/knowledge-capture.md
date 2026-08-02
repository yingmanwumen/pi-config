# Knowledge Capture

Use this workflow for decisions, how-tos, FAQs, wiki entries, learnings, or documentation derived from a conversation.

1. Clarify purpose, audience, freshness, and whether this is new or an update.
2. Search Notion with one literal query at a time; fetch candidate pages and databases before choosing a destination.
3. Extract facts, decisions, rationale, actions, links, owners, and unresolved questions.
4. Draft the page with an explicit parent. For database-backed pages, fetch the database schema first and populate only valid properties.
5. Create the page with `POST /v1/pages`, or update an existing page only after fetching its current properties and blocks.
6. Add related-page links, backlinks, tags, owners, and follow-up tasks when supported by the destination schema.
7. Re-fetch the result and report its Notion URL, changes, and any assumptions.

Do not overwrite an existing page from a partial fetch. If multiple databases are plausible, ask the user to choose.
