# 🌐 CityNav — Intelligent Route Finder

A **Graph-Based City Navigation Web Application** that helps users find the shortest path between locations using classic graph algorithms (Dijkstra, BFS, DFS) with beautiful, interactive D3.js visualization and voice-powered navigation.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Tech](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS%20%7C%20D3.js-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 📑 Table of Contents

- [About](#-about)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Algorithms Used](#-algorithms-used)
- [How to Run](#-how-to-run)
- [Usage Guide](#-usage-guide)
- [Voice Navigation](#-voice-navigation)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)

---

## 📖 About

**CityNav** is a single-page web application that demonstrates graph-based pathfinding algorithms in a real-world-like scenario — navigating a city. Users can:

- Select a source & destination from 18+ city locations
- Compute the optimal route using **Dijkstra's**, **BFS**, or **DFS** algorithms
- Visualize the path on an interactive, zoomable graph with D3.js
- Compare alternative routes side-by-side
- Simulate live traffic conditions that dynamically change edge weights
- Manage the city graph (add/remove locations & roads) via the Admin panel
- Use **voice commands** to select routes hands-free
- Get **spoken turn-by-turn navigation** directions

This project is ideal for **DSA students**, **developers learning graph algorithms**, and anyone interested in route optimization.

---

## ⭐ Features

### 🔹 Core
| Feature | Description |
|---|---|
| **Shortest Path** | Compute optimal route using Dijkstra's algorithm |
| **Multiple Algorithms** | Choose between Dijkstra, BFS, or DFS |
| **Route Display** | Step-by-step route with distance and estimated time |
| **Alternative Routes** | View up to 3 different path options |
| **Graph Visualization** | Interactive D3.js graph with zoom, pan, and hover |

### 🔥 Advanced
| Feature | Description |
|---|---|
| **Live Traffic Simulation** | Dynamic edge weights that change in real-time |
| **One-Way Roads** | Support for directional edges with arrow markers |
| **Admin Panel** | Add/remove locations & roads dynamically |
| **Import/Export** | Save and load graph data as JSON |
| **Dark / Light Mode** | Full theme support with smooth transitions |

### 🎨 Visualization
| Feature | Description |
|---|---|
| **Path Highlighting** | Shortest path in green, alternatives in gray |
| **Animated Traversal** | Watch the algorithm explore nodes step-by-step |
| **Node Pulse Effects** | Source & destination nodes pulse with glow |
| **Traffic Coloring** | Edges colored green/yellow/red based on congestion |
| **Weighted Labels** | Distance shown on every edge |

### 🔊 Voice & Accessibility
| Feature | Description |
|---|---|
| **Voice Commands** | Say "Go from Airport to Mall" to find a route hands-free |
| **Voice Navigation** | Spoken turn-by-turn directions with step highlighting |
| **Mic Input** | Microphone buttons on source/destination fields for individual voice input |
| **Fuzzy Node Matching** | Smart matching of spoken location names to graph nodes |
| **Auto-Play Directions** | Automatically speak route directions on path completion |
| **Natural Directions** | Compass-based directional hints (head north, head east, etc.) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Home Page   │  │   Map Page   │  │  Admin Page  │  │
│  │              │  │              │  │              │  │
│  │ • Path Input │  │ • D3.js Graph│  │ • Node CRUD  │  │
│  │ • Algo Select│  │ • Route Panel│  │ • Edge CRUD  │  │
│  │ • Voice Cmd  │  │ • Voice Nav  │  │ • Preview    │  │
│  │ • Mic Input  │  │ • Toolbar    │  │ • Import/Exp │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └────────┬────────┴────────┬────────┘           │
│                  │                 │                     │
│         ┌────────▼────────┐ ┌─────▼──────────┐          │
│         │   App Controller│ │ Graph Visualizer│          │
│         │   (app.js)      │ │ (visualization  │          │
│         │                 │ │      .js)       │          │
│         │ • SPA Routing   │ │ • D3.js Render  │          │
│         │ • Event Handling│ │ • Zoom / Pan    │          │
│         │ • Toasts / UI   │ │ • Animations    │          │
│         └────────┬────────┘ └────────────────┘          │
│                  │                                       │
│    ┌─────────────▼──────────────┐                        │
│    │     Graph Algorithm Engine │                        │
│    │         (graph.js)         │                        │
│    │                            │                        │
│    │  • Dijkstra (weighted)     │                        │
│    │  • BFS (unweighted)        │                        │
│    │  • DFS (traversal)         │                        │
│    │  • Alt-path finder         │                        │
│    │  • MinPriorityQueue        │                        │
│    └─────────────┬──────────────┘                        │
│                  │                                       │
│    ┌─────────────▼──────────────┐                        │
│    │    Data Layer              │                        │
│    ├────────────────────────────┤                        │
│    │  cityData.js  │ localStorage│                       │
│    │  (defaults)   │ (persisted) │                       │
│    └───────────────┴────────────┘                        │
│                                                         │
│    ┌────────────────────────────┐  ┌──────────────────┐  │
│    │  Traffic Simulator         │  │  Voice Engine    │  │
│    │  (trafficSimulation.js)    │  │  (voice.js)      │  │
│    │  • Random weight changes   │  │  • TTS (speak)   │  │
│    │  • Congestion classification│  │  • STT (listen)  │  │
│    └────────────────────────────┘  │  • Fuzzy match   │  │
│                                    │  • Directions gen │  │
│                                    └──────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User selects Source & Destination (dropdown or voice 🎤)
        │
        ▼
App Controller validates input
        │
        ▼
Graph Engine runs algorithm (Dijkstra / BFS / DFS)
        │
        ├──► Returns: path[], distance, visited[], steps[]
        │
        ▼
Alt-path finder computes up to 3 alternative routes
        │
        ▼
Visualization engine renders results on D3.js canvas
        │
        ├──► Path highlighted in green
        ├──► Visited nodes shown in yellow
        ├──► Route panel displays step-by-step directions
        └──► Voice engine speaks turn-by-turn navigation 🔊
```

---

## 📁 Project Structure

```
DSA- project/
│
├── index.html                  # Single-page application shell
│                               # Contains all 3 pages (Home, Map, Admin)
│
├── css/
│   ├── index.css               # Design system: tokens, reset, navbar, buttons,
│   │                           # inputs, loading overlay, toasts, theme support
│   ├── home.css                # Hero section, path finder card, features grid,
│   │                           # voice command button, mic input styles
│   ├── map.css                 # Graph canvas, route panel, D3 element styles,
│   │                           # legend, toolbar, tooltips, voice nav panel
│   ├── admin.css               # Admin forms, lists, toggle switches, graph preview
│   └── components.css          # Shared/reusable component styles (cards, badges,
│                               # toggle switches, responsive utilities)
│
├── js/
│   ├── graph.js                # 🧠 Core: Graph class, Dijkstra, BFS, DFS,
│   │                           #    MinPriorityQueue, serialization, alt-paths
│   ├── cityData.js             # 🗺️ Default city: 18 locations, 30+ roads
│   ├── trafficSimulation.js    # 🚦 Live traffic: random weight changes,
│   │                           #    congestion levels, event dispatch
│   ├── visualization.js        # 🎨 D3.js engine: graph rendering, zoom/pan,
│   │                           #    path highlighting, animations, tooltips
│   ├── voice.js                # 🔊 Voice engine: Text-to-Speech navigation,
│   │                           #    Speech-to-Text input, fuzzy node matching,
│   │                           #    natural direction generation
│   └── app.js                  # ⚙️ Main controller: SPA routing, event handlers,
│                               #    state management, localStorage, UI updates
│
└── README.md                   # This file
```

### Key Files Explained

| File | Role | Size |
|---|---|---|
| `app.js` | Application controller — wires everything together | ~35 KB |
| `graph.js` | Graph data structure + 3 pathfinding algorithms + priority queue | ~12 KB |
| `visualization.js` | D3.js rendering engine with animations and interactivity | ~12 KB |
| `voice.js` | Voice engine — TTS navigation, STT input, fuzzy matching | ~12 KB |
| `cityData.js` | Default city graph (18 nodes, 31 edges) | ~5 KB |
| `trafficSimulation.js` | Dynamic edge weight randomizer | ~2 KB |
| `index.css` | Global design tokens + dark/light theme | ~12 KB |
| `components.css` | Shared component styles | ~5 KB |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Structure** | HTML5 | Semantic page layout |
| **Styling** | Vanilla CSS3 | Design system with custom properties |
| **Logic** | Vanilla JavaScript (ES6+) | Algorithms, state, routing |
| **Visualization** | [D3.js v7](https://d3js.org/) (CDN) | Interactive SVG graph rendering |
| **Voice** | [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | Text-to-Speech & Speech Recognition |
| **Fonts** | [Google Fonts — Inter](https://fonts.google.com/specimen/Inter) | Modern typography |
| **Storage** | `localStorage` | Persistent graph & theme data |

> **No build tools, no Node.js, no frameworks** — opens directly in any modern browser.

---

## 🧠 Algorithms Used

### 1. Dijkstra's Algorithm ⭐
- **Type:** Weighted shortest path
- **Complexity:** O((V + E) log V) with min-heap
- **Use case:** Finding the optimal route considering road distances
- **Implementation:** Custom `MinPriorityQueue` (binary heap)

### 2. BFS (Breadth-First Search)
- **Type:** Unweighted shortest path (fewest hops)
- **Complexity:** O(V + E)
- **Use case:** Finding the route with fewest stops

### 3. DFS (Depth-First Search)
- **Type:** Graph traversal (not necessarily shortest)
- **Complexity:** O(V + E)
- **Use case:** Exploring all reachable paths

### 4. K-Shortest Paths (Alternative Routes)
- **Strategy:** Edge-removal from Dijkstra's shortest path
- **Returns:** Up to 3 distinct routes for comparison

---

# 🚀 How to Run

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- That's it! No installations required.

### Option 1: Open Directly (Simplest)
```bash
# Just double-click index.html in your file explorer
# OR right-click → Open with → your browser
```

### Option 2: VS Code Live Server
```bash
# 1. Open the project folder in VS Code
code "c:\DSA- project"

# 2. Install the "Live Server" extension (if not already installed)
#    Extensions → Search "Live Server" → Install

# 3. Right-click index.html → "Open with Live Server"
#    App opens at http://127.0.0.1:5500
```

### Option 3: Python HTTP Server
```bash
# Navigate to the project directory
cd "c:\DSA- project"

# Start a local server (bind to IPv4 to prevent connection loopback issues)
python -m http.server 8000 --bind 127.0.0.1

# Open browser to http://127.0.0.1:8000
```


> ⚠️ **Note:** The app loads D3.js from a CDN (`https://d3js.org/d3.v7.min.js`), so an **internet connection is required** for graph visualization to work.

---

## 📘 Usage Guide

### Finding a Route
1. Open the app → you land on the **Home Page**
2. Select a **Source** location from the dropdown
3. Select a **Destination** location from the dropdown
4. Choose an **Algorithm** (Dijkstra recommended for optimal path)
5. Click **"Find Path"**
6. You're navigated to the **Map Page** showing:
   - The shortest path highlighted in **green**
   - Visited nodes in **yellow**
   - Route steps, distance, and estimated time in the side panel

### Using the Map
- **Zoom:** Scroll wheel or toolbar +/- buttons
- **Pan:** Click and drag on the canvas
- **Hover:** Mouse over nodes to see location names
- **Traffic:** Click the traffic button (🚦) to enable live simulation
- **Animation:** Toggle path animation on/off with the play button
- **Alt Routes:** Click any alternative route card to preview it

### Admin Panel
- **Add Location:** Enter name + X/Y coordinates → click "Add Location"
- **Add Road:** Select from/to locations, distance, one-way toggle → click "Add Road"
- **Delete:** Click the trash icon on any location or road
- **Reset:** Restore the default 18-location city
- **Export:** Download the current graph as a JSON file
- **Import:** Upload a previously exported JSON file

### Theme
- Click the **sun/moon icon** in the navbar to toggle Dark ↔ Light mode
- Your preference is saved automatically

---

## 🔊 Voice Navigation

CityNav includes a full **Voice Engine** powered by the browser's built-in [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API). No third-party services or API keys required.

### 🎤 Voice Input (Speech-to-Text)

**Full Route Command:**
- Click the **"Voice Command"** button on the Home page
- Speak a natural command like:
  - *"Go from Airport to Mall"*
  - *"Navigate Central Station to City Park"*
  - *"Find route from University to Harbor"*
- The app parses your speech, fuzzy-matches location names, and auto-fills the form

**Individual Field Input:**
- Click the **microphone icon** (🎤) next to the Source or Destination dropdown
- Speak a single location name — it will be matched and selected automatically

### 🔈 Voice Navigation (Text-to-Speech)

After finding a route:
1. Open the **Route Details** panel on the Map page
2. Click **"Play Voice"** in the Voice Navigation section
3. The app speaks turn-by-turn directions, for example:
   - *"Starting navigation from Airport to Grand Mall."*
   - *"Head towards Grand Hotel. Distance: 7 kilometers."*
   - *"Head southwest. Proceed to Tech Park. 5 kilometers."*
   - *"You have arrived at Grand Mall. Total distance: 18 kilometers. Estimated time: 27 minutes."*

**Controls:**
| Control | Action |
|---|---|
| **Play Voice** | Start speaking the route directions |
| **Stop** | Stop the voice mid-sentence |
| **Auto toggle** | Auto-speak directions when a new route is found |
| **🔊 toolbar button** | Quick-trigger voice navigation from the map toolbar |

### Direction Intelligence

The voice engine generates **compass-based directional hints** using node coordinates:

| Direction | When |
|---|---|
| *"Head north"* | Destination node is above the current node |
| *"Head east"* | Destination node is to the right |
| *"Head southwest"* | Destination node is below-left |
| *(8 directions total)* | Based on atan2 angle between nodes |

### Browser Compatibility

| Browser | TTS (Speak) | STT (Listen) |
|---|---|---|
| **Chrome** | ✅ Full | ✅ Full |
| **Edge** | ✅ Full | ✅ Full |
| **Firefox** | ✅ Full | ❌ Not supported |
| **Safari** | ✅ Full | ✅ Partial (webkit) |

> 💡 **Tip:** Chrome / Edge provide the best voice experience with both TTS and STT support.

---

## 🗺️ Default City Map

The app ships with **"Metro City"** — a fictional city with 18 locations:

| Location | Connections |
|---|---|
| Central Station | Museum, Mall, Park, Tech Park, Old Town, Grand Hotel |
| Airport | Hospital, Grand Hotel, Sunset Beach |
| University | Museum, Old Town, Government Office, Stadium |
| City Hospital | Grand Hotel, Tech Park, Airport |
| City Park | Stadium, Library, Old Town, Central Station |
| Grand Mall | Tech Park, Harbor, Library, Central Station |
| Sports Stadium | Market, Government Office, University, Park |
| Harbor | Sunset Beach, Tech Park, Grand Mall |
| Tech Park | Beach, Central Station, Hospital, Mall, Harbor |
| And 9 more... | Public Library, Farmers Market, Cinema, Train Yard, etc. |

Includes **2 one-way roads** (Hotel → Museum, Government Office → Museum).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions
- 🌍 Real-world map integration (Google Maps / Leaflet)
- 📊 Algorithm comparison dashboard (speed, nodes visited)
- 🎮 Interactive graph builder (drag-and-drop nodes)
- 📱 Progressive Web App (PWA) support
- 🧪 Unit tests for graph algorithms
- 🌐 Multi-language voice support

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for DSA learners & navigation enthusiasts
</p>
