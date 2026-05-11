/* =============================================
   Graph Data Structure & Algorithms
   Supports: Dijkstra, BFS, DFS, All Paths
   ============================================= */

class Graph {
    constructor() {
        this.nodes = new Map();   // id -> { id, name, x, y }
        this.edges = [];          // [{ source, dest, weight, oneWay }]
        this.adjacency = new Map(); // id -> [{ to, weight, edgeIndex }]
    }

    // ---------- Node Operations ----------

    addNode(id, name, x, y) {
        if (this.nodes.has(id)) return false;
        this.nodes.set(id, { id, name, x, y });
        this.adjacency.set(id, []);
        return true;
    }

    removeNode(id) {
        if (!this.nodes.has(id)) return false;
        this.nodes.delete(id);
        this.adjacency.delete(id);
        // Remove edges connected to this node
        this.edges = this.edges.filter(e => e.source !== id && e.dest !== id);
        // Rebuild adjacency for remaining edges
        this._rebuildAdjacency();
        return true;
    }

    getNode(id) {
        return this.nodes.get(id) || null;
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    // ---------- Edge Operations ----------

    addEdge(source, dest, weight, oneWay = false) {
        if (!this.nodes.has(source) || !this.nodes.has(dest)) return false;
        if (source === dest) return false;

        // Check for duplicates
        const duplicate = this.edges.find(e =>
            e.source === source && e.dest === dest
        );
        if (duplicate) return false;

        const edgeIndex = this.edges.length;
        this.edges.push({ source, dest, weight, oneWay });

        // Add to adjacency
        this.adjacency.get(source).push({ to: dest, weight, edgeIndex });
        if (!oneWay) {
            this.adjacency.get(dest).push({ to: source, weight, edgeIndex });
        }
        return true;
    }

    removeEdge(source, dest) {
        const idx = this.edges.findIndex(e =>
            (e.source === source && e.dest === dest) ||
            (!e.oneWay && e.source === dest && e.dest === source)
        );
        if (idx === -1) return false;
        this.edges.splice(idx, 1);
        this._rebuildAdjacency();
        return true;
    }

    removeEdgeByIndex(index) {
        if (index < 0 || index >= this.edges.length) return false;
        this.edges.splice(index, 1);
        this._rebuildAdjacency();
        return true;
    }

    getAllEdges() {
        return [...this.edges];
    }

    // ---------- Algorithms ----------

    /**
     * Dijkstra's Algorithm — weighted shortest path
     * Returns { path: [nodeIds], distance, visited: [nodeIds], steps: [...] }
     */
    dijkstra(source, dest) {
        if (!this.nodes.has(source) || !this.nodes.has(dest)) {
            return { path: [], distance: Infinity, visited: [], steps: [] };
        }

        const dist = new Map();
        const prev = new Map();
        const visited = new Set();
        const steps = []; // For animation
        const pq = new MinPriorityQueue();

        // Init distances
        for (const [id] of this.nodes) {
            dist.set(id, Infinity);
        }
        dist.set(source, 0);
        pq.enqueue(source, 0);

        while (!pq.isEmpty()) {
            const { element: u, priority: d } = pq.dequeue();

            if (visited.has(u)) continue;
            visited.add(u);
            steps.push({ type: 'visit', node: u, distance: d });

            if (u === dest) break;

            const neighbors = this.adjacency.get(u) || [];
            for (const { to: v, weight } of neighbors) {
                if (visited.has(v)) continue;
                const newDist = dist.get(u) + weight;
                if (newDist < dist.get(v)) {
                    dist.set(v, newDist);
                    prev.set(v, u);
                    pq.enqueue(v, newDist);
                    steps.push({ type: 'relax', from: u, to: v, distance: newDist });
                }
            }
        }

        // Reconstruct path
        const path = [];
        if (dist.get(dest) !== Infinity) {
            let current = dest;
            while (current !== undefined) {
                path.unshift(current);
                current = prev.get(current);
            }
        }

        return {
            path,
            distance: dist.get(dest),
            visited: Array.from(visited),
            steps
        };
    }

    /**
     * BFS — unweighted shortest path (fewest hops)
     */
    bfs(source, dest) {
        if (!this.nodes.has(source) || !this.nodes.has(dest)) {
            return { path: [], distance: Infinity, visited: [], steps: [] };
        }

        const visited = new Set([source]);
        const prev = new Map();
        const queue = [source];
        const steps = [];
        let found = false;

        steps.push({ type: 'visit', node: source, distance: 0 });

        while (queue.length > 0) {
            const u = queue.shift();

            if (u === dest) {
                found = true;
                break;
            }

            const neighbors = this.adjacency.get(u) || [];
            for (const { to: v } of neighbors) {
                if (!visited.has(v)) {
                    visited.add(v);
                    prev.set(v, u);
                    queue.push(v);
                    steps.push({ type: 'visit', node: v });
                    steps.push({ type: 'relax', from: u, to: v });
                }
            }
        }

        const path = [];
        if (found) {
            let current = dest;
            while (current !== undefined) {
                path.unshift(current);
                current = prev.get(current);
            }
        }

        // Compute total distance along BFS path
        let distance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const edge = this.edges.find(e =>
                (e.source === path[i] && e.dest === path[i + 1]) ||
                (!e.oneWay && e.source === path[i + 1] && e.dest === path[i])
            );
            if (edge) distance += edge.weight;
        }

        return {
            path,
            distance: found ? distance : Infinity,
            visited: Array.from(visited),
            steps
        };
    }

    /**
     * DFS — depth-first search path (not necessarily shortest)
     */
    dfs(source, dest) {
        if (!this.nodes.has(source) || !this.nodes.has(dest)) {
            return { path: [], distance: Infinity, visited: [], steps: [] };
        }

        const visited = new Set();
        const steps = [];
        const path = [];
        let found = false;

        const dfsHelper = (u) => {
            if (found) return;
            visited.add(u);
            path.push(u);
            steps.push({ type: 'visit', node: u });

            if (u === dest) {
                found = true;
                return;
            }

            const neighbors = this.adjacency.get(u) || [];
            for (const { to: v } of neighbors) {
                if (!visited.has(v) && !found) {
                    steps.push({ type: 'relax', from: u, to: v });
                    dfsHelper(v);
                }
            }

            if (!found) {
                path.pop();
                steps.push({ type: 'backtrack', node: u });
            }
        };

        dfsHelper(source);

        // Compute total distance along DFS path
        let distance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const edge = this.edges.find(e =>
                (e.source === path[i] && e.dest === path[i + 1]) ||
                (!e.oneWay && e.source === path[i + 1] && e.dest === path[i])
            );
            if (edge) distance += edge.weight;
        }

        return {
            path: found ? path : [],
            distance: found ? distance : Infinity,
            visited: Array.from(visited),
            steps
        };
    }

    /**
     * Find multiple paths (up to limit) using k-shortest-paths approach
     */
    findAlternativePaths(source, dest, limit = 3) {
        const paths = [];
        const mainResult = this.dijkstra(source, dest);
        if (mainResult.path.length === 0) return paths;
        paths.push({ path: mainResult.path, distance: mainResult.distance });

        // Simple approach: try removing edges one at a time from shortest path
        for (let i = 0; i < mainResult.path.length - 1 && paths.length < limit; i++) {
            const u = mainResult.path[i];
            const v = mainResult.path[i + 1];

            // Temporarily remove this edge
            const edgeIdx = this.edges.findIndex(e =>
                (e.source === u && e.dest === v) ||
                (!e.oneWay && e.source === v && e.dest === u)
            );

            if (edgeIdx === -1) continue;
            const removedEdge = this.edges[edgeIdx];
            this.edges.splice(edgeIdx, 1);
            this._rebuildAdjacency();

            const altResult = this.dijkstra(source, dest);
            if (altResult.path.length > 0 && altResult.distance < Infinity) {
                const pathStr = altResult.path.join(',');
                const isDuplicate = paths.some(p => p.path.join(',') === pathStr);
                if (!isDuplicate) {
                    paths.push({ path: altResult.path, distance: altResult.distance });
                }
            }

            // Restore edge
            this.edges.splice(edgeIdx, 0, removedEdge);
            this._rebuildAdjacency();
        }

        return paths;
    }

    // ---------- Internal Helpers ----------

    _rebuildAdjacency() {
        this.adjacency = new Map();
        for (const [id] of this.nodes) {
            this.adjacency.set(id, []);
        }
        this.edges.forEach((edge, idx) => {
            if (this.adjacency.has(edge.source)) {
                this.adjacency.get(edge.source).push({
                    to: edge.dest,
                    weight: edge.weight,
                    edgeIndex: idx
                });
            }
            if (!edge.oneWay && this.adjacency.has(edge.dest)) {
                this.adjacency.get(edge.dest).push({
                    to: edge.source,
                    weight: edge.weight,
                    edgeIndex: idx
                });
            }
        });
    }

    // ---------- Serialization ----------

    toJSON() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: this.edges
        };
    }

    static fromJSON(json) {
        const g = new Graph();
        for (const node of json.nodes) {
            g.addNode(node.id, node.name, node.x, node.y);
        }
        for (const edge of json.edges) {
            g.addEdge(edge.source, edge.dest, edge.weight, edge.oneWay || false);
        }
        return g;
    }
}


/* =============================================
   Min Priority Queue (for Dijkstra)
   ============================================= */

class MinPriorityQueue {
    constructor() {
        this.heap = [];
    }

    enqueue(element, priority) {
        this.heap.push({ element, priority });
        this._bubbleUp(this.heap.length - 1);
    }

    dequeue() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._sinkDown(0);
        }
        return min;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    _bubbleUp(i) {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            if (this.heap[parent].priority <= this.heap[i].priority) break;
            [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
            i = parent;
        }
    }

    _sinkDown(i) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            if (left < n && this.heap[left].priority < this.heap[smallest].priority) {
                smallest = left;
            }
            if (right < n && this.heap[right].priority < this.heap[smallest].priority) {
                smallest = right;
            }
            if (smallest === i) break;
            [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
            i = smallest;
        }
    }
}
