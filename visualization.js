/* =============================================
   D3.js Graph Visualization Engine
   ============================================= */

class GraphVisualization {
    constructor(svgSelector, graph, options = {}) {
        this.svgElement = document.querySelector(svgSelector);
        this.graph = graph;
        this.options = {
            nodeRadius: 14,
            animate: true,
            ...options
        };

        this.svg = null;
        this.container = null;
        this.zoom = null;

        this.highlightedPath = [];
        this.highlightedAltPaths = [];
        this.visitedNodes = new Set();
        this.sourceNode = null;
        this.destNode = null;
        this.trafficLevels = new Map();

        this._tooltip = null;
        this._init();
    }

    _init() {
        if (!this.svgElement || typeof d3 === 'undefined') return;

        this.svg = d3.select(this.svgElement);
        this.svg.selectAll('*').remove();

        // Create tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.className = 'graph-tooltip';
        this.svgElement.parentElement.appendChild(this._tooltip);

        // Defs for markers (arrows)
        const defs = this.svg.append('defs');

        defs.append('marker')
            .attr('id', 'arrow-default')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 26)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('class', 'edge-arrow');

        defs.append('marker')
            .attr('id', 'arrow-path')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 26)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('class', 'edge-arrow path-arrow');

        // Container for pan/zoom
        this.container = this.svg.append('g').attr('class', 'graph-container');

        // Layers
        this.edgeLayer = this.container.append('g').attr('class', 'edge-layer');
        this.edgeLabelLayer = this.container.append('g').attr('class', 'edge-label-layer');
        this.nodeLayer = this.container.append('g').attr('class', 'node-layer');

        // Zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                this.container.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Initial render
        this.render();
        this._fitView();
    }

    render() {
        if (!this.svg) return;
        this._renderEdges();
        this._renderNodes();
    }

    _renderEdges() {
        const edges = this.graph.getAllEdges();
        const nodes = this.graph.getAllNodes();
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        // Build a set of path edges for highlighting
        const pathEdgeSet = new Set();
        for (let i = 0; i < this.highlightedPath.length - 1; i++) {
            pathEdgeSet.add(`${this.highlightedPath[i]}->${this.highlightedPath[i + 1]}`);
            pathEdgeSet.add(`${this.highlightedPath[i + 1]}->${this.highlightedPath[i]}`);
        }

        const altEdgeSet = new Set();
        for (const altPath of this.highlightedAltPaths) {
            for (let i = 0; i < altPath.length - 1; i++) {
                const key1 = `${altPath[i]}->${altPath[i + 1]}`;
                const key2 = `${altPath[i + 1]}->${altPath[i]}`;
                if (!pathEdgeSet.has(key1)) {
                    altEdgeSet.add(key1);
                    altEdgeSet.add(key2);
                }
            }
        }

        const visitedEdgeSet = new Set();
        // Mark edges between visited nodes
        for (const edge of edges) {
            if (this.visitedNodes.has(edge.source) && this.visitedNodes.has(edge.dest)) {
                visitedEdgeSet.add(`${edge.source}->${edge.dest}`);
            }
        }

        // --- Edge lines ---
        const edgeSelection = this.edgeLayer.selectAll('.edge-line')
            .data(edges, (d, i) => `${d.source}-${d.dest}-${i}`);

        edgeSelection.exit().remove();

        const edgeEnter = edgeSelection.enter()
            .append('line')
            .attr('class', 'edge-line');

        const edgeMerge = edgeEnter.merge(edgeSelection);

        edgeMerge
            .attr('x1', d => nodeMap.get(d.source)?.x || 0)
            .attr('y1', d => nodeMap.get(d.source)?.y || 0)
            .attr('x2', d => nodeMap.get(d.dest)?.x || 0)
            .attr('y2', d => nodeMap.get(d.dest)?.y || 0)
            .attr('marker-end', d => d.oneWay ? 'url(#arrow-default)' : null)
            .attr('class', (d, i) => {
                const key = `${d.source}->${d.dest}`;
                let cls = 'edge-line';
                if (pathEdgeSet.has(key)) {
                    cls += ' path-edge';
                    if (this.options.animate) cls += ' path-animated';
                } else if (altEdgeSet.has(key)) {
                    cls += ' alt-edge';
                } else if (visitedEdgeSet.has(key)) {
                    cls += ' visited-edge';
                }
                // Traffic
                if (this.trafficLevels.has(i)) {
                    cls += ` traffic-${this.trafficLevels.get(i)}`;
                }
                return cls;
            });

        // Update arrow for path edges
        edgeMerge.attr('marker-end', (d) => {
            if (!d.oneWay) return null;
            const key = `${d.source}->${d.dest}`;
            return pathEdgeSet.has(key) ? 'url(#arrow-path)' : 'url(#arrow-default)';
        });

        // --- Edge labels (weight) ---
        const labelData = edges.map((e, i) => ({
            ...e,
            index: i,
            mx: ((nodeMap.get(e.source)?.x || 0) + (nodeMap.get(e.dest)?.x || 0)) / 2,
            my: ((nodeMap.get(e.source)?.y || 0) + (nodeMap.get(e.dest)?.y || 0)) / 2
        }));

        const labelBgSelection = this.edgeLabelLayer.selectAll('.edge-label-bg')
            .data(labelData, d => `${d.source}-${d.dest}-${d.index}`);
        labelBgSelection.exit().remove();
        const labelBgEnter = labelBgSelection.enter().append('rect').attr('class', 'edge-label-bg');
        labelBgEnter.merge(labelBgSelection)
            .attr('x', d => d.mx - 12)
            .attr('y', d => d.my - 8)
            .attr('width', 24)
            .attr('height', 16);

        const labelSelection = this.edgeLabelLayer.selectAll('.edge-label')
            .data(labelData, d => `${d.source}-${d.dest}-${d.index}`);
        labelSelection.exit().remove();
        const labelEnter = labelSelection.enter().append('text').attr('class', 'edge-label');
        labelEnter.merge(labelSelection)
            .attr('x', d => d.mx)
            .attr('y', d => d.my + 4)
            .text(d => d.weight);
    }

    _renderNodes() {
        const nodes = this.graph.getAllNodes();
        const self = this;

        // --- Node groups ---
        const nodeSelection = this.nodeLayer.selectAll('.node-group')
            .data(nodes, d => d.id);

        nodeSelection.exit().remove();

        const nodeEnter = nodeSelection.enter()
            .append('g')
            .attr('class', 'node-group');

        // Pulse ring
        nodeEnter.append('circle')
            .attr('class', 'node-pulse')
            .attr('r', this.options.nodeRadius);

        // Main circle
        nodeEnter.append('circle')
            .attr('class', 'node-circle')
            .attr('r', this.options.nodeRadius);

        // Label
        nodeEnter.append('text')
            .attr('class', 'node-label')
            .attr('dy', this.options.nodeRadius + 16);

        // Merge
        const nodeMerge = nodeEnter.merge(nodeSelection);

        nodeMerge.attr('transform', d => `translate(${d.x}, ${d.y})`);

        nodeMerge.select('.node-circle')
            .attr('class', d => {
                let cls = 'node-circle';
                if (d.id === this.sourceNode) cls += ' source-node';
                else if (d.id === this.destNode) cls += ' dest-node';
                else if (this.highlightedPath.includes(d.id)) cls += ' path-node';
                else if (this.visitedNodes.has(d.id)) cls += ' visited-node';
                return cls;
            });

        nodeMerge.select('.node-pulse')
            .attr('class', d => {
                if (d.id === this.sourceNode) return 'node-pulse source-pulse';
                if (d.id === this.destNode) return 'node-pulse dest-pulse';
                return 'node-pulse';
            })
            .style('animation', d => {
                if (d.id === this.sourceNode || d.id === this.destNode) {
                    return 'nodePulse 2s ease-out infinite';
                }
                return 'none';
            });

        nodeMerge.select('.node-label')
            .text(d => d.name);

        // Hover tooltip
        nodeMerge
            .on('mouseenter', function (event, d) {
                self._showTooltip(event, d.name);
            })
            .on('mousemove', function (event) {
                self._moveTooltip(event);
            })
            .on('mouseleave', function () {
                self._hideTooltip();
            });
    }

    // ---------- Public API ----------

    setPath(path, visited, source, dest) {
        this.highlightedPath = path || [];
        this.visitedNodes = new Set(visited || []);
        this.sourceNode = source;
        this.destNode = dest;
        this.render();
    }

    setAltPaths(altPaths) {
        this.highlightedAltPaths = altPaths || [];
        this.render();
    }

    setTrafficLevels(levels) {
        this.trafficLevels = levels;
        this.render();
    }

    clearHighlights() {
        this.highlightedPath = [];
        this.highlightedAltPaths = [];
        this.visitedNodes = new Set();
        this.sourceNode = null;
        this.destNode = null;
        this.trafficLevels = new Map();
        this.render();
    }

    zoomIn() {
        this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.3);
    }

    zoomOut() {
        this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.77);
    }

    resetView() {
        this._fitView(true);
    }

    refresh() {
        this._init();
    }

    // ---------- Private ----------

    _fitView(animate = false) {
        const nodes = this.graph.getAllNodes();
        if (nodes.length === 0) return;

        const svgRect = this.svgElement.getBoundingClientRect();
        const padding = 80;
        
        // Fallback dimensions if container is hidden during initialization (e.g. display: none)
        const width = svgRect.width > 0 ? svgRect.width : 800;
        const height = svgRect.height > 0 ? svgRect.height : 600;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of nodes) {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x);
            maxY = Math.max(maxY, n.y);
        }

        const graphWidth = maxX - minX || 1;
        const graphHeight = maxY - minY || 1;
        
        // Ensure scale doesn't become negative if graph is huge or padding > width/height
        let scale = Math.min(
            Math.max(0.1, (width - padding * 2) / graphWidth),
            Math.max(0.1, (height - padding * 2) / graphHeight),
            1.5
        );
        
        const tx = (width - graphWidth * scale) / 2 - minX * scale;
        const ty = (height - graphHeight * scale) / 2 - minY * scale;

        const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

        if (animate) {
            this.svg.transition().duration(500).call(this.zoom.transform, transform);
        } else {
            this.svg.call(this.zoom.transform, transform);
        }
    }

    _showTooltip(event, text) {
        this._tooltip.textContent = text;
        this._tooltip.classList.add('visible');
        this._moveTooltip(event);
    }

    _moveTooltip(event) {
        const rect = this.svgElement.parentElement.getBoundingClientRect();
        this._tooltip.style.left = (event.clientX - rect.left + 12) + 'px';
        this._tooltip.style.top = (event.clientY - rect.top - 8) + 'px';
    }

    _hideTooltip() {
        this._tooltip.classList.remove('visible');
    }

    /**
     * Animate algorithm steps (visited nodes appearing one by one)
     */
    async animateSteps(steps, speed = 120) {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (step.type === 'visit') {
                this.visitedNodes.add(step.node);
            }
            this.render();
            await new Promise(r => setTimeout(r, speed));
        }
    }
}
