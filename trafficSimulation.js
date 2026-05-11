/* =============================================
   Traffic Simulation — Dynamic Edge Weights
   ============================================= */

class TrafficSimulator {
    constructor(graph) {
        this.graph = graph;
        this.active = false;
        this.intervalId = null;
        this.originalWeights = new Map();
        this.trafficLevels = new Map(); // edgeIndex -> 'low' | 'med' | 'high'
        this._saveOriginalWeights();
    }

    _saveOriginalWeights() {
        this.graph.edges.forEach((edge, idx) => {
            this.originalWeights.set(idx, edge.weight);
        });
    }

    start(intervalMs = 5000) {
        if (this.active) return;
        this.active = true;
        this._tick();
        this.intervalId = setInterval(() => this._tick(), intervalMs);
    }

    stop() {
        this.active = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        // Restore original weights
        this.graph.edges.forEach((edge, idx) => {
            if (this.originalWeights.has(idx)) {
                edge.weight = this.originalWeights.get(idx);
            }
        });
        this.trafficLevels.clear();
    }

    _tick() {
        this.graph.edges.forEach((edge, idx) => {
            const original = this.originalWeights.get(idx) || edge.weight;
            const factor = 0.8 + Math.random() * 1.2; // 0.8x to 2.0x
            const newWeight = Math.round(original * factor * 10) / 10;
            edge.weight = Math.max(1, newWeight);

            // Classify traffic level
            if (factor < 1.0) {
                this.trafficLevels.set(idx, 'low');
            } else if (factor < 1.5) {
                this.trafficLevels.set(idx, 'med');
            } else {
                this.trafficLevels.set(idx, 'high');
            }
        });

        // Rebuild adjacency to reflect new weights
        this.graph._rebuildAdjacency();

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('traffic-update', {
            detail: { trafficLevels: new Map(this.trafficLevels) }
        }));
    }

    getTrafficLevel(edgeIndex) {
        return this.trafficLevels.get(edgeIndex) || 'low';
    }

    isActive() {
        return this.active;
    }
}
