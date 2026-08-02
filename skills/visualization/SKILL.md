---
description: Visualization workflows using the Kroki and QuickChart HTTP APIs for generating diagrams, charts, QR codes, and barcodes. Use when a task requires rendering Mermaid, PlantUML, GraphViz, Chart.js, or other visual assets as PNG, SVG, PDF, or shareable URLs.
license: MIT
metadata:
    author: local
    tags: diagrams, charts, kroki, quickchart, mermaid, graphviz, chartjs, qr-code
name: visualization
---
# Visualization Workflows

Use the public Kroki and QuickChart APIs to render visual assets without requiring local browser rendering.

## Workflow routing

Read only the reference needed for the task:

| Task | Reference |
| --- | --- |
| Render Mermaid, PlantUML, GraphViz, D2, ER, UML, or other text diagrams | [kroki.md](references/kroki.md) |
| Generate Chart.js charts, QR codes, barcodes, word clouds, or natural-language charts | [quickchart.md](references/quickchart.md) |

## Quick decision

| User wants... | Use |
|---|---|
| A diagram from textual syntax | Kroki, usually `POST /{type}/{format}` |
| A chart from structured data | QuickChart, usually `POST /chart` |
| A chart or diagram embedded by URL | The corresponding GET endpoint with URL encoding |
| A QR code or barcode | QuickChart QR/barcode endpoint |

Prefer POST for larger or ad-hoc payloads. Use GET when a direct shareable or embeddable URL is specifically needed. Save binary responses to a file with `-o`.
