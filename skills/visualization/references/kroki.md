# Kroki — Free Diagram Rendering API

Kroki provides a unified HTTP API to convert plain text diagram descriptions into images (PNG, SVG, PDF, etc.). It supports over 25 diagram libraries.

**Public endpoint:** `https://kroki.io`

---

## Quick Decision

| User wants... | Use |
|---|---|
| Render PlantUML / Mermaid / GraphViz / D2 as image | `POST /{type}/{format}` — plain text body |
| Shareable diagram link | `GET /{type}/{format}/{encoded}` — encoded in URL |
| Embed diagram in Markdown / HTML | Use GET with encoded URL as `<img>` src |
| Pass options to diagram engine | JSON body with `diagram_options` field |

---

## API Usage

### Method 1: POST (plain text, no encoding — RECOMMENDED)

Send diagram source as raw text body. Simplest approach.

```bash
# URL format: POST https://kroki.io/{diagram_type}/{output_format}
# Content-Type: text/plain
# Body: the diagram source

curl -s https://kroki.io/plantuml/svg --data-binary '@diagram.puml'
curl -s https://kroki.io/mermaid/svg --data-binary '@diagram.mmd'
curl -s https://kroki.io/graphviz/png --data-binary '@diagram.dot' -o output.png

# Inline (HEREDOC)
curl -s https://kroki.io/mermaid/svg \
  -H 'Content-Type: text/plain' \
  --data-binary @- <<'EOF' > diagram.svg
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
EOF
```

### Method 2: POST (JSON body)

```bash
curl -s -X POST https://kroki.io/ \
  -H 'Content-Type: application/json' \
  -d '{
    "diagram_source": "digraph G {Hello->World}",
    "diagram_type": "graphviz",
    "output_format": "svg"
  }' > output.svg
```

With diagram options:

```bash
curl -s -X POST https://kroki.io/ \
  -H 'Content-Type: application/json' \
  -d '{
    "diagram_source": "digraph G {Hello->World}",
    "diagram_type": "graphviz",
    "output_format": "svg",
    "diagram_options": {"layout": "neato"}
  }' > output.svg
```

### Method 3: GET (encoded URL — for shareable links / `<img>` embeds)

Diagrams are encoded using **deflate + base64url**. Use the encoding snippet below.

URL pattern: `GET https://kroki.io/{type}/{format}/{encoded_diagram}`

#### Encoding (diagram source → encoded string)

```bash
# Python one-liner
python3 -c "import sys,base64,zlib; print(base64.urlsafe_b64encode(zlib.compress(sys.stdin.read().encode(), 9)).decode().rstrip('='))"
```

```bash
# Node.js one-liner
node -e "process.stdin.on('data',d=>{const z=require('zlib');z.deflateRaw(d,(e,b)=>console.log(b.toString('base64url')))})"
```

#### Full GET example

```bash
# Encode and request in one pipeline
ENCODED=$(echo 'digraph G {Hello->World}' | python3 -c "import sys,base64,zlib; print(base64.urlsafe_b64encode(zlib.compress(sys.stdin.read().encode(), 9)).decode().rstrip('='))")
curl -s "https://kroki.io/graphviz/svg/$ENCODED" > output.svg
```

#### Decoding (for debugging)

```bash
echo "eNpLyUwvSizIUHBXqPZIzcnJ17ULzy_KSanlAgB1EAjQ" | python3 -c "import sys,base64,zlib; print(zlib.decompress(base64.urlsafe_b64decode(sys.stdin.read() + '==')).decode())"
```

---

## Supported Diagram Types & Output Formats

| Diagram Type | png | svg | pdf | Notes |
|---|---|---|---|---|
| **PlantUML** | ✔ | ✔ | ✔ | Sequence, class, use-case, activity, component, state, object, deployment, timing, C4, Gantt, mindmap, WBS, JSON/YAML |
| **Mermaid** | | ✔ | | Flowchart, sequence, class, state, ER, Gantt, pie, git graph, timeline, mindmap, C4, Sankey, block, XY chart |
| **GraphViz** | ✔ | ✔ | ✔ | DOT language for directed/undirected graphs |
| **C4 with PlantUML** | ✔ | ✔ | ✔ | C4 architecture diagrams via PlantUML |
| **D2** | | ✔ | | Modern declarative diagram language |
| **BPMN** | | ✔ | | Business Process Model and Notation |
| **Excalidraw** | | ✔ | | Hand-drawn style diagrams |
| **Vega** | ✔ | ✔ | ✔ | Declarative visualization grammar |
| **Vega-Lite** | ✔ | ✔ | ✔ | High-level grammar for statistical graphics |
| **Structurizr** | ✔ | ✔ | ✔ | C4 architecture model DSL |
| **BlockDiag** | ✔ | ✔ | | Block, Sequence, Activity, Network, Packet, Rack diagrams |
| **Ditaa** | ✔ | ✔ | | ASCII art to diagrams |
| **Erd** | ✔ | ✔ | ✔ | Entity Relationship Diagrams |
| **Nomnoml** | | ✔ | | UML-style diagrams |
| **Pikchr** | | ✔ | | Compact diagram language (SQLite) |
| **Svgbob** | | ✔ | | ASCII to SVG |
| **Symbolator** | | ✔ | | Component symbol diagrams |
| **TikZ** | ✔ | ✔ | ✔ | LaTeX TikZ pictures |
| **UMLet** | ✔ | ✔ | ✔ | UML diagrams |
| **WaveDrom** | | ✔ | | Digital timing diagrams |
| **Bytefield** | | ✔ | | Byte field diagrams |
| **DBML** | | ✔ | | Database Markup Language |
| **WireViz** | ✔ | ✔ | | Cable/wiring harness diagrams |
| **GoAT** | | ✔ | | ASCII graphviz-like |

---

## Diagram Options

Pass engine-specific options as query params (GET) or `diagram_options` (JSON POST) or `Kroki-Diagram-Options-<Key>` headers. Precedence: query params > JSON options > headers.

| Engine | Option | Description |
|---|---|---|
| GraphViz | `layout` | `dot`, `neato`, `fdp`, `sfdp`, `twopi`, `circo` |
| PlantUML | `theme` | e.g. `amiga`, `aws-orange`, `blueprint`, `cerulean`, `hacker`, `silver`, `toy`, `vibrant` |
| D2 | `layout` | `dagre`, `elk`, `tala` |
| D2 | `sketch` | `true` for hand-drawn aesthetic |
| Ditaa | `scale` | Scale multiplier (e.g. `1.5`) |
| Mermaid | `theme` | `default`, `neutral`, `dark`, `forest`, `base` |
| Svgbob | `background` | Background color (`white`, `transparent`, etc.) |
| Symbolator | `scale` | Scale multiplier |
| Symbolator | `no-type` | `true` to hide type info |

```bash
# Example: PlantUML with theme
curl -s -X POST https://kroki.io/ \
  -H 'Content-Type: application/json' \
  -d '{
    "diagram_source": "Alice -> Bob: Hello",
    "diagram_type": "plantuml",
    "output_format": "svg",
    "diagram_options": {"theme": "hacker"}
  }' > output.svg

# Example: GET with query param
ENCODED=$(echo 'Alice -> Bob: Hello' | python3 -c "import sys,base64,zlib; print(base64.urlsafe_b64encode(zlib.compress(sys.stdin.read().encode(), 9)).decode().rstrip('='))")
curl -s "https://kroki.io/plantuml/svg/$ENCODED?theme=hacker" > output.svg
```

---

## Practical Recipes

### Generate PlantUML sequence diagram as SVG

```bash
cat <<'PUML' | curl -s https://kroki.io/plantuml/svg -H 'Content-Type: text/plain' --data-binary @- > seq.svg
@startuml
actor Client
participant Server
database DB
Client -> Server: Request
Server -> DB: Query
DB --> Server: Result
Server --> Client: Response
@enduml
PUML
```

### Generate Mermaid flowchart

```bash
cat <<'MMD' | curl -s https://kroki.io/mermaid/svg -H 'Content-Type: text/plain' --data-binary @- > flow.svg
flowchart LR
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
MMD
```

### Generate GraphViz architecture diagram as PNG

```bash
cat <<'DOT' | curl -s https://kroki.io/graphviz/png -H 'Content-Type: text/plain' --data-binary @- > arch.png
digraph Architecture {
    rankdir=LR;
    node [shape=box, style=rounded];
    Browser -> LB [label="HTTPS"];
    LB -> API1, API2;
    API1 -> DB;
    API2 -> DB;
    API1 -> Cache;
    API2 -> Cache;
}
DOT
```

### Generate C4 Container diagram

```bash
cat <<'C4' | curl -s https://kroki.io/c4plantuml/svg -H 'Content-Type: text/plain' --data-binary @- > c4.svg
@startuml
!include <C4/C4_Container>
Person(customer, "Customer", "E-commerce customer")
System(webapp, "Web Application", "React SPA")
Container(api, "API", "Go", "REST API")
ContainerDb(db, "Database", "PostgreSQL", "Stores orders")
Rel(customer, webapp, "Uses", "HTTPS")
Rel(webapp, api, "API calls", "JSON/HTTPS")
Rel(api, db, "Reads/Writes", "SQL")
@enduml
C4
```

### Generate ER diagram

```bash
cat <<'ERD' | curl -s https://kroki.io/erd/svg -H 'Content-Type: text/plain' --data-binary @- > erd.svg
[User]
*id
name
email

[Order]
*id
user_id
total
created_at

User 1--* Order
ERD
```

### Generate a shareable link (for <img> embedding)

```bash
DIAGRAM='graph TD
    A[Start] --> B[Process]
    B --> C[End]'

ENCODED=$(echo "$DIAGRAM" | python3 -c "import sys,base64,zlib; print(base64.urlsafe_b64encode(zlib.compress(sys.stdin.read().encode(), 9)).decode().rstrip('='))")

# Use this URL in <img> tags or share it
echo "https://kroki.io/mermaid/svg/$ENCODED"
```

---

## Tips

- **Prefer POST over GET** for ad-hoc rendering — no encoding needed, simpler
- **Use GET encoded URLs** when you need a permanent link or `<img>` src — Kroki caches them
- **Save to file** with `-o output.svg` or shell redirect `> output.svg`
- **Reading diagram from file:** use `--data-binary '@file.puml'` (preserves newlines, critical for some engines)
- **Inline:** use `--data-binary @-` with heredoc `<<'EOF'` (single-quote EOF to prevent shell expansion)
- **Large diagrams:** POST is better; GET URL length may hit limits
- **Kroki public instance is free but rate-limited.** For heavy use, consider self-hosting (Docker: `yuzutech/kroki`)
