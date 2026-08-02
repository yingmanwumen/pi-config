# QuickChart — Chart Image & QR Code API

QuickChart is an HTTP API that generates static images (PNG, SVG, WebP, PDF) of Chart.js charts, QR codes, and barcodes. No client-side rendering required — just an HTTP request.

**Public endpoint:** `https://quickchart.io`

---

## Quick Decision

| User wants... | Use |
|---|---|
| Simple chart from data (bar, line, pie, etc.) | `POST /chart` with Chart.js config JSON |
| Tiny / embeddable chart URL | `GET /chart?c={config}` (URL-encode the config) |
| Validate chart config before rendering | `POST /api/validate-chart` |
| Generate chart from natural language description | `POST /natural/config` |
| QR code | `GET /qr?text=...` or `POST /qr` |
| GraphViz diagram | `POST /graphviz` |
| Word cloud | `POST /wordcloud` |

---

## Endpoint 1: GET /chart (URL-based, simple charts)

Best for small, hand-written configs. URL-encode the `chart` parameter.

```
GET https://quickchart.io/chart
  ?width=500
  &height=300
  &devicePixelRatio=1
  &backgroundColor=white
  &version=4
  &format=png
  &chart={type:'bar',data:{labels:['Q1','Q2','Q3'],datasets:[{label:'Users',data:[50,60,70]}]}}
```

### Parameters

| Parameter | Alias | Type | Default | Description |
|---|---|---|---|---|
| `chart` | `c` | string (JS/JSON) | **required** | Chart.js configuration object |
| `width` | `w` | integer | 500 | Image width in pixels |
| `height` | `h` | integer | 300 | Image height in pixels |
| `devicePixelRatio` | — | integer | 2 | `1` for 1x, `2` for retina |
| `backgroundColor` | `bkg` | string | transparent | CSS color, hex, rgb, hsl |
| `version` | `v` | string | `2.9.4` | Chart.js version: `2`, `3`, `4` |
| `format` | `f` | string | `png` | `png`, `svg`, `webp`, `jpg`, `pdf`, `base64` |
| `encoding` | — | string | `url` | `url` or `base64` for the `chart` param |

### URL Encoding

Always URL-encode the `chart` param:

```bash
# JavaScript
const url = `https://quickchart.io/chart?chart=${encodeURIComponent(JSON.stringify(chartConfig))}`

# Python
import urllib.parse, json
url = f"https://quickchart.io/chart?chart={urllib.parse.quote(json.dumps(chartConfig))}"

# For direct GET: encode as single-quote-able JS object
# Use single-quoted keys/values to avoid double-quote URL encoding issues
```

---

## Endpoint 2: POST /chart (JSON body — RECOMMENDED)

No URL encoding. Send Chart.js config as JSON. Returns raw image bytes.

```bash
curl -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "4",
    "width": 700,
    "height": 360,
    "devicePixelRatio": 1,
    "format": "png",
    "backgroundColor": "white",
    "chart": {
      "type": "bar",
      "data": {
        "labels": ["Jan", "Feb", "Mar", "Apr"],
        "datasets": [
          {
            "label": "Revenue",
            "data": [120, 150, 180, 210],
            "backgroundColor": "rgba(54, 162, 235, 0.7)",
            "borderColor": "rgb(54, 162, 235)",
            "borderWidth": 1
          }
        ]
      },
      "options": {
        "plugins": {
          "title": {
            "display": true,
            "text": "Monthly Revenue"
          }
        }
      }
    }
  }' -o chart.png
```

### POST Body Shape

```typescript
{
  width: number;                    // Pixel width (default 500)
  height: number;                   // Pixel height (default 300)
  devicePixelRatio: number;         // 1 or 2 (default 2)
  format: string;                   // png | svg | webp | jpg | pdf | base64
  backgroundColor: string;          // CSS color or "transparent"
  version: string;                  // "2", "3", "4", or specific like "4.4.0"
  key: string;                      // API key (optional, for authenticated plans)
  chart: string | object;           // Chart.js config. Use string if it contains JS functions.
}
```

---

## Endpoint 3: POST /api/validate-chart

Validate a chart config without rendering. Returns structured errors.

```bash
curl -X POST https://quickchart.io/api/validate-chart \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "4",
    "chart": {
      "type": "bar",
      "data": {
        "labels": ["Jan", "Feb", "Mar"],
        "datasets": [{ "label": "Revenue", "data": [120, 150, 180] }]
      }
    }
  }'
```

Success response: `{ "valid": true }`. Failure includes the validation error.

---

## Endpoint 4: POST /natural/config (Natural Language → Chart)

Describe a chart in plain English, get back a Chart.js config + image URL.

```bash
curl -X POST https://quickchart.io/natural/config \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "horizontal bar chart showing top 5 programming languages: JavaScript 65%, Python 48%, Java 35%, TypeScript 34%, C# 27%",
    "width": 700,
    "height": 360,
    "backgroundColor": "white"
  }'
```

Response includes:
- `config`: generated Chart.js config string
- `url`: saved chart image URL
- `chartEditorUrl`: link to interactive editor

> ⚠️ Treat generated configs as drafts. Validate with `/api/validate-chart` before production use.

---

## Endpoint 5: GET/POST /qr (QR Codes)

```bash
# GET (simple)
curl "https://quickchart.io/qr?text=https://example.com&size=300&format=png" -o qr.png

# POST (complex payloads)
curl -X POST https://quickchart.io/qr \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "https://example.com",
    "size": 300,
    "format": "png",
    "margin": 4,
    "ecLevel": "M",
    "dark": "000000",
    "light": "ffffff"
  }' -o qr.png
```

### QR Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `text` | string | **required** | QR code data |
| `size` | integer | 150 | Image size (pixels, square) |
| `format` | string | `png` | `png` or `svg` |
| `margin` | integer | 4 | White border in modules |
| `ecLevel` | string | `M` | Error correction: `L`, `M`, `Q`, `H` |
| `dark` | string | `000000` | Dark module hex color |
| `light` | string | `ffffff` | Light module hex color |

---

## Endpoint 6: POST /graphviz (GraphViz diagrams)

Render GraphViz DOT language as images.

```bash
curl -X POST https://quickchart.io/graphviz \
  -H 'Content-Type: application/json' \
  -d '{
    "format": "png",
    "graph": "digraph G { rankdir=LR; A -> B -> C; A -> C; }"
  }' -o graph.png
```

---

## Endpoint 7: POST /wordcloud

```bash
curl -X POST https://quickchart.io/wordcloud \
  -H 'Content-Type: application/json' \
  -d '{
    "format": "png",
    "width": 600,
    "height": 400,
    "fontScale": 40,
    "scale": "linear",
    "text": "QuickChart is an API that generates chart images"
  }' -o wordcloud.png
```

---

## Supported Chart Types (Chart.js)

All Chart.js chart types are supported. Set `"type"` in config to:

| Type | Description |
|---|---|
| `bar` | Bar chart (vertical/horizontal) |
| `line` | Line chart |
| `pie` | Pie chart |
| `doughnut` | Doughnut chart |
| `radar` | Radar chart |
| `polarArea` | Polar area chart |
| `scatter` | Scatter plot |
| `bubble` | Bubble chart |
| `radialGauge` | Radial gauge (plugin) |
| `boxplot` | Box plot (plugin) |
| `violin` | Violin plot (plugin) |

---

## Plugins (Chart.js v2 only — via `version: "2"`)

QuickChart bundles several Chart.js plugins:

| Plugin | What it does |
|---|---|
| `chartjs-plugin-datalabels` | Display values on data points |
| `chartjs-plugin-annotation` | Add lines, boxes, labels on chart |
| `chartjs-plugin-piechart-outlabels` | Out-of-slice labels for pie charts |
| `chartjs-chart-radial-gauge` | Radial gauge chart type |
| `chartjs-chart-box-and-violin-plot` | Box and violin plot types |
| `chartjs-plugin-doughnutlabel` | Center text in doughnut charts |
| `chartjs-plugin-colorschemes` | Pre-built color palettes |

Note: v3/v4 have limited plugin support. Use `version: "2"` if you need plugins.

---

## Practical Recipes

### Bar Chart

```bash
curl -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "4",
    "width": 600, "height": 350,
    "format": "png", "backgroundColor": "white",
    "chart": {
      "type": "bar",
      "data": {
        "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "datasets": [{
          "label": "Sales",
          "data": [120, 200, 150, 80, 250],
          "backgroundColor": "rgba(75, 192, 192, 0.6)"
        }]
      }
    }
  }' -o bar.png
```

### Multi-series Line Chart

```bash
CONFIG=$(cat <<'EOF'
{
  "type": "line",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
    "datasets": [
      {
        "label": "Users",
        "data": [100, 200, 300, 400, 500],
        "borderColor": "rgb(54, 162, 235)",
        "fill": false
      },
      {
        "label": "Revenue",
        "data": [50, 120, 180, 220, 350],
        "borderColor": "rgb(255, 99, 132)",
        "fill": false
      }
    ]
  }
}
EOF
)
curl -s -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -d "{\"version\":\"4\",\"width\":600,\"height\":350,\"format\":\"png\",\"backgroundColor\":\"white\",\"chart\":$CONFIG}" \
  -o line.png
```

### Pie Chart with Colors

```bash
curl -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "4", "width": 500, "height": 500,
    "format": "png", "backgroundColor": "white",
    "chart": {
      "type": "pie",
      "data": {
        "labels": ["JavaScript", "Python", "Java", "TypeScript", "Go"],
        "datasets": [{
          "data": [40, 25, 15, 12, 8],
          "backgroundColor": [
            "#f1e05a", "#3572A5", "#b07219", "#3178c6", "#00ADD8"
          ]
        }]
      },
      "options": {
        "plugins": {
          "title": { "display": true, "text": "Language Usage" }
        }
      }
    }
  }' -o pie.png
```

### Horizontal Bar Chart

```bash
curl -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "4", "width": 600, "height": 400,
    "format": "png", "backgroundColor": "white",
    "chart": {
      "type": "bar",
      "data": {
        "labels": ["Go", "Rust", "Python", "JavaScript", "C++"],
        "datasets": [{
          "label": "Performance Score",
          "data": [90, 88, 45, 35, 92],
          "backgroundColor": "rgba(153, 102, 255, 0.7)"
        }]
      },
      "options": {
        "indexAxis": "y",
        "plugins": {
          "legend": { "display": false }
        }
      }
    }
  }' -o hbar.png
```

### Scatter Plot

```bash
curl -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "4", "width": 600, "height": 400,
    "format": "png", "backgroundColor": "white",
    "chart": {
      "type": "scatter",
      "data": {
        "datasets": [{
          "label": "Group A",
          "data": [{ "x": 5, "y": 8 }, { "x": 7, "y": 12 }, { "x": 3, "y": 5 }, { "x": 9, "y": 15 }],
          "backgroundColor": "rgba(255, 99, 132, 0.7)"
        }]
      },
      "options": {
        "scales": {
          "x": { "title": { "display": true, "text": "X Axis" } },
          "y": { "title": { "display": true, "text": "Y Axis" } }
        }
      }
    }
  }' -o scatter.png
```

### Doughnut Chart with Center Label (v2 plugin)

```bash
curl -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "2", "width": 500, "height": 500,
    "format": "png", "backgroundColor": "white",
    "chart": {
      "type": "doughnut",
      "data": {
        "labels": ["Complete", "In Progress", "Not Started"],
        "datasets": [{
          "data": [65, 25, 10],
          "backgroundColor": ["#4CAF50", "#FFC107", "#F44336"]
        }]
      },
      "options": {
        "plugins": {
          "doughnutlabel": {
            "labels": [
              { "text": "65%", "font": { "size": 40, "weight": "bold" } },
              { "text": "completed" }
            ]
          }
        }
      }
    }
  }' -o doughnut.png
```

### Generate chart via natural language

```bash
RESPONSE=$(curl -s -X POST https://quickchart.io/natural/config \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "line chart of monthly active users Jan to Jun: 1200, 1500, 1800, 2100, 2400, 3000. Title: MAU Growth",
    "width": 700, "height": 360, "backgroundColor": "white"
  }')

# Extract the image URL from response
echo "$RESPONSE" | jq -r '.url'
# Or extract the config
echo "$RESPONSE" | jq '.config'
```

### Generate a shareable chart URL (for HTML/Markdown embedding)

```bash
# Python
python3 -c "
import json, urllib.parse
config = {
    'type': 'bar',
    'data': {
        'labels': ['Q1', 'Q2', 'Q3', 'Q4'],
        'datasets': [{'label': 'Sales', 'data': [50, 60, 70, 100]}]
    }
}
encoded = urllib.parse.quote(json.dumps(config))
print(f'https://quickchart.io/chart?width=500&height=300&version=4&backgroundColor=white&chart={encoded}')
"

# Use the URL in Markdown: ![chart](https://quickchart.io/chart?...)
# Use in HTML: <img src="https://quickchart.io/chart?..." />
```

### Choose Chart.js v2 for built-in colorschemes

```bash
curl -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "2", "width": 500, "height": 400,
    "format": "png", "backgroundColor": "white",
    "chart": {
      "type": "pie",
      "data": {
        "labels": ["A", "B", "C", "D", "E"],
        "datasets": [{
          "data": [30, 25, 20, 15, 10]
        }]
      },
      "options": {
        "plugins": {
          "colorschemes": { "scheme": "brewer.SetThree9" }
        }
      }
    }
  }' -o colorscheme.png
```

---

## API Key / Authentication

For hosted/paid plans, add `"key": "YOUR_API_KEY"` to POST body or use the `Authorization` header:

```bash
curl -X POST https://quickchart.io/chart \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{ ... }'
```

---

## Tips

- **Prefer POST over GET.** POST avoids URL length limits and encoding headaches. Only use GET for tiny configs or when you genuinely need a direct `<img>` URL.
- **Set `version: "4"`** for Chart.js v4 syntax — it's the current generation with the best documentation.
- **Set `devicePixelRatio: 1`** if you need exact pixel dimensions. Default is 2 (retina).
- **Validate first.** Use `/api/validate-chart` before embedding charts in production to catch config errors.
- **Natural language is a draft.** Always validate `/natural/config` output before production use.
- **Use `version: "2"` if you need plugins** like datalabels, annotations, doughnut labels, or colorschemes.
- **For SVG output**, set `"format": "svg"`. Note: SVGs include `<foreignObject>` for text, which may not render in all viewers.
- **`chart` as a string:** If your config contains JavaScript functions (e.g., for label formatting), send `"chart"` as a string instead of a JSON object.
- **Health check:** `GET https://quickchart.io/healthcheck` returns `{"success":true}`.
- **OpenAPI spec:** `https://quickchart.io/openapi.json` for full API schema.
