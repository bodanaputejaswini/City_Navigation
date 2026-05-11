/* =============================================
   CityNav — Main Application Controller
   ============================================= */

(function () {
    'use strict';

    // ============ State ============
    let graph = null;
    let mainViz = null;
    let adminViz = null;
    let trafficSim = null;
    let voiceEngine = null;
    let currentPage = 'home';
    let currentResult = null;
    let animateEnabled = true;
    let voiceNavActive = false;

    // ============ DOM References ============
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Pages
    const pages = {
        home: $('#page-home'),
        map: $('#page-map'),
        admin: $('#page-admin')
    };

    // ============ Init ============
    function init() {
        loadGraph();
        setupNavigation();
        setupTheme();
        setupHomePage();
        setupMapPage();
        setupAdminPage();
        setupVoice();
        generateHeroBgAnimation();
        updateStats();
        populateDropdowns();
    }

    // ============ Graph Loading ============
    function loadGraph() {
        const saved = localStorage.getItem('citynav-graph');
        if (saved) {
            try {
                graph = Graph.fromJSON(JSON.parse(saved));
            } catch (e) {
                console.warn('Failed to load saved graph, using defaults');
                graph = Graph.fromJSON(getDefaultCityData());
            }
        } else {
            graph = Graph.fromJSON(getDefaultCityData());
        }
        trafficSim = new TrafficSimulator(graph);
    }

    function saveGraph() {
        localStorage.setItem('citynav-graph', JSON.stringify(graph.toJSON()));
    }

    // ============ Navigation ============
    function setupNavigation() {
        $$('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(link.dataset.page);
            });
        });

        // Mobile menu
        $('#mobile-menu-btn').addEventListener('click', () => {
            $('#navbar-links').classList.toggle('open');
        });
    }

    function navigateTo(page) {
        currentPage = page;

        // Update nav links
        $$('.nav-link').forEach(l => l.classList.remove('active'));
        $(`.nav-link[data-page="${page}"]`).classList.add('active');

        // Update pages
        Object.values(pages).forEach(p => p.classList.remove('active'));
        pages[page].classList.add('active');

        // Close mobile menu
        $('#navbar-links').classList.remove('open');

        // Refresh visualizations when switching pages
        if (page === 'map') {
            setTimeout(() => {
                if (!mainViz) {
                    mainViz = new GraphVisualization('#graph-svg', graph);
                } else {
                    mainViz.graph = graph;
                    mainViz.refresh();
                }
                // Restore last result
                if (currentResult) {
                    mainViz.setPath(
                        currentResult.path,
                        currentResult.visited,
                        currentResult.source,
                        currentResult.dest
                    );
                    if (currentResult.altPaths) {
                        mainViz.setAltPaths(currentResult.altPaths.map(a => a.path));
                    }
                }
            }, 50);
        }

        if (page === 'admin') {
            setTimeout(() => refreshAdminPage(), 50);
        }
    }

    // ============ Theme ============
    function setupTheme() {
        const saved = localStorage.getItem('citynav-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);

        $('#theme-toggle').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('citynav-theme', next);
        });
    }

    // ============ Home Page ============
    function setupHomePage() {
        // Find Path button
        $('#find-path-btn').addEventListener('click', handleFindPath);

        // Reset button
        $('#reset-btn').addEventListener('click', () => {
            $('#source-select').value = '';
            $('#dest-select').value = '';
            currentResult = null;
            if (mainViz) mainViz.clearHighlights();
            hideRouteInfo();
            showToast('Form reset', 'info');
        });

        // Swap button
        $('#swap-btn').addEventListener('click', () => {
            const src = $('#source-select');
            const dst = $('#dest-select');
            [src.value, dst.value] = [dst.value, src.value];
        });

        // Algorithm selector
        $$('input[name="algorithm"]').forEach(radio => {
            radio.addEventListener('change', () => {
                $$('.algo-option').forEach(o => o.classList.remove('active'));
                radio.closest('.algo-option').classList.add('active');
            });
        });
    }

    // ============ Validation ============
    function validateLocations(source, dest) {
        // Check if both are selected
        if (!source && !dest) {
            showToast('Please select both source & destination', 'error');
            return false;
        }
        if (!source) {
            showToast('Please select a source location', 'error');
            return false;
        }
        if (!dest) {
            showToast('Please select a destination location', 'error');
            return false;
        }

        // Check if source === dest
        if (source === dest) {
            showToast('Source and destination cannot be the same location', 'error');
            return false;
        }

        // Check if source exists in graph
        const sourceNode = graph.getNode(source);
        if (!sourceNode) {
            showToast(`Source location "${source}" does not exist in the graph`, 'error');
            return false;
        }

        // Check if destination exists in graph
        const destNode = graph.getNode(dest);
        if (!destNode) {
            showToast(`Destination location "${dest}" does not exist in the graph`, 'error');
            return false;
        }

        // Check if source has any connections
        const sourceEdges = graph.edges.filter(
            e => e.source === source || (!e.oneWay && e.dest === source)
        );
        if (sourceEdges.length === 0) {
            showToast(`${sourceNode.name} has no connecting roads`, 'error');
            return false;
        }

        // Check if destination has any connections
        const destEdges = graph.edges.filter(
            e => e.dest === dest || (!e.oneWay && e.source === dest)
        );
        if (destEdges.length === 0) {
            showToast(`${destNode.name} has no connecting roads`, 'error');
            return false;
        }

        return true;
    }

    function handleFindPath() {
        const source = $('#source-select').value;
        const dest = $('#dest-select').value;
        const algo = document.querySelector('input[name="algorithm"]:checked').value;

        // Validate locations
        if (!validateLocations(source, dest)) {
            return;
        }

        // Show loading
        showLoading();

        setTimeout(() => {
            let result;
            switch (algo) {
                case 'dijkstra':
                    result = graph.dijkstra(source, dest);
                    break;
                case 'bfs':
                    result = graph.bfs(source, dest);
                    break;
                case 'dfs':
                    result = graph.dfs(source, dest);
                    break;
            }

            if (!result || result.path.length === 0) {
                hideLoading();
                const srcName = graph.getNode(source)?.name || source;
                const destName = graph.getNode(dest)?.name || dest;
                showToast(`No route found between "${srcName}" and "${destName}". They may not be connected.`, 'error');
                return;
            }

            // Find alternative paths
            const altPaths = graph.findAlternativePaths(source, dest, 3);

            currentResult = {
                ...result,
                source,
                dest,
                algo,
                altPaths: altPaths.slice(1) // Exclude the main path
            };

            hideLoading();

            // Navigate to map
            navigateTo('map');

            // Set visualization
            setTimeout(() => {
                if (mainViz) {
                    if (animateEnabled) {
                        mainViz.setPath([], [], source, dest);
                        mainViz.animateSteps(result.steps, 80).then(() => {
                            mainViz.setPath(result.path, result.visited, source, dest);
                            if (currentResult.altPaths.length > 0) {
                                mainViz.setAltPaths(currentResult.altPaths.map(a => a.path));
                            }
                        });
                    } else {
                        mainViz.setPath(result.path, result.visited, source, dest);
                        if (currentResult.altPaths.length > 0) {
                            mainViz.setAltPaths(currentResult.altPaths.map(a => a.path));
                        }
                    }
                }

                showRouteInfo(currentResult);
                showToast(`Route found! Distance: ${result.distance} km`, 'success');

                // Auto voice if enabled
                const autoVoice = $('#voice-auto-play');
                if (autoVoice && autoVoice.checked && voiceEngine) {
                    setTimeout(() => startVoiceNavigation(currentResult), 600);
                }
            }, 200);

        }, 400); // Simulated processing time for effect
    }

    // ============ Map Page ============
    function setupMapPage() {
        // Zoom controls
        $('#zoom-in-btn').addEventListener('click', () => mainViz?.zoomIn());
        $('#zoom-out-btn').addEventListener('click', () => mainViz?.zoomOut());
        $('#zoom-reset-btn').addEventListener('click', () => mainViz?.resetView());

        // Traffic toggle
        $('#traffic-toggle-btn').addEventListener('click', () => {
            if (trafficSim.isActive()) {
                trafficSim.stop();
                $('#traffic-toggle-btn').classList.remove('active');
                if (mainViz) mainViz.setTrafficLevels(new Map());
                showToast('Traffic simulation disabled', 'info');
            } else {
                trafficSim.start(4000);
                $('#traffic-toggle-btn').classList.add('active');
                showToast('Traffic simulation enabled', 'success');
            }
        });

        // Listen for traffic updates
        window.addEventListener('traffic-update', (e) => {
            if (mainViz && currentPage === 'map') {
                mainViz.setTrafficLevels(e.detail.trafficLevels);
            }
        });

        // Animate toggle
        $('#animate-toggle-btn').addEventListener('click', () => {
            animateEnabled = !animateEnabled;
            $('#animate-toggle-btn').classList.toggle('active', animateEnabled);
            showToast(`Path animation ${animateEnabled ? 'enabled' : 'disabled'}`, 'info');
        });
        $('#animate-toggle-btn').classList.add('active');

        // Panel close
        $('#panel-close-btn').addEventListener('click', () => {
            $('#route-panel').classList.toggle('collapsed');
        });

        // Voice nav toolbar button
        $('#voice-nav-btn').addEventListener('click', () => {
            if (!currentResult) {
                showToast('Find a route first to use voice navigation', 'info');
                return;
            }
            if (voiceNavActive) {
                stopVoiceNavigation();
            } else {
                startVoiceNavigation(currentResult);
            }
        });

        // Stop voice toolbar button
        $('#stop-voice-btn').addEventListener('click', () => {
            stopVoiceNavigation();
        });

        // Route panel voice controls
        $('#play-voice-btn').addEventListener('click', () => {
            if (currentResult) startVoiceNavigation(currentResult);
        });
        $('#stop-voice-nav-btn').addEventListener('click', () => {
            stopVoiceNavigation();
        });
    }

    function showRouteInfo(result) {
        $('#no-route-msg').classList.add('hidden');
        $('#route-info').classList.remove('hidden');

        // Stats
        const dist = result.distance === Infinity ? Infinity : result.distance;
        $('#route-distance').textContent = dist === Infinity ? '∞' : dist;
        $('#route-time').textContent = dist === Infinity ? '—' : formatTime(dist);
        $('#route-visited').textContent = result.visited.length;
        $('#route-speed').textContent = '40'; // default speed

        // Algo badge
        const algoNames = { dijkstra: 'Dijkstra', bfs: 'BFS', dfs: 'DFS' };
        $('#route-algo-badge').textContent = algoNames[result.algo] || result.algo;

        // Route steps
        const stepsList = $('#route-steps-list');
        stepsList.innerHTML = '';
        result.path.forEach((nodeId, i) => {
            const node = graph.getNode(nodeId);
            const li = document.createElement('li');
            li.className = 'route-step';
            li.style.animationDelay = `${i * 0.08}s`;

            let distLabel = '';
            if (i < result.path.length - 1) {
                const nextId = result.path[i + 1];
                const edge = graph.edges.find(e =>
                    (e.source === nodeId && e.dest === nextId) ||
                    (!e.oneWay && e.source === nextId && e.dest === nodeId)
                );
                if (edge) {
                    distLabel = `<span class="step-distance">${edge.weight} km</span>`;
                }
            }

            li.innerHTML = `${node?.name || nodeId}${distLabel}`;
            stepsList.appendChild(li);
        });

        // Alt routes
        const altList = $('#alt-routes-list');
        altList.innerHTML = '';
        if (result.altPaths && result.altPaths.length > 0) {
            result.altPaths.forEach((alt, idx) => {
                const card = document.createElement('div');
                card.className = 'alt-route-card';
                const pathNames = alt.path.map(id => graph.getNode(id)?.name || id);
                card.innerHTML = `
                    <div class="alt-route-path">Route ${idx + 2}: ${pathNames.join(' → ')}</div>
                    <div class="alt-route-dist">Distance: ${alt.distance} km · ETA: ${formatTime(alt.distance)}</div>
                `;
                card.addEventListener('click', () => {
                    if (mainViz) {
                        mainViz.setPath(alt.path, [], result.source, result.dest);
                    }
                });
                altList.appendChild(card);
            });
        } else {
            altList.innerHTML = '<p class="alt-none">No alternative routes found.</p>';
        }
    }

    function hideRouteInfo() {
        $('#no-route-msg').classList.remove('hidden');
        $('#route-info').classList.add('hidden');
    }

    // ============ Voice Navigation ============
    function setupVoice() {
        voiceEngine = new VoiceEngine();

        // Check support
        const support = VoiceEngine.isSupported();
        if (!support.synthesis) {
            // Hide voice nav buttons if not supported
            const voiceBtn = $('#voice-nav-btn');
            if (voiceBtn) voiceBtn.style.display = 'none';
        }
        if (!support.recognition) {
            // Hide mic buttons if not supported
            $$('.mic-btn').forEach(btn => btn.style.display = 'none');
            const cmdBtn = $('#voice-command-btn');
            if (cmdBtn) cmdBtn.style.display = 'none';
        }

        // Mic button for source
        $('#mic-source-btn')?.addEventListener('click', () => {
            handleMicInput('source');
        });

        // Mic button for destination
        $('#mic-dest-btn')?.addEventListener('click', () => {
            handleMicInput('dest');
        });

        // Full voice command button
        $('#voice-command-btn')?.addEventListener('click', () => {
            handleVoiceCommand();
        });

        // Listening state change
        voiceEngine.onListeningChange = (listening) => {
            const status = $('#voice-status');
            if (listening) {
                status.classList.remove('hidden');
            } else {
                status.classList.add('hidden');
            }
        };
    }

    async function handleMicInput(target) {
        if (!voiceEngine) return;

        const btn = target === 'source' ? $('#mic-source-btn') : $('#mic-dest-btn');
        btn.classList.add('listening');
        const statusText = $('#voice-status-text');
        statusText.textContent = `Listening for ${target === 'source' ? 'source' : 'destination'}...`;
        $('#voice-status').classList.remove('hidden');

        try {
            const { text, confidence } = await voiceEngine.startListening();
            statusText.textContent = `Heard: "${text}"`;

            // Try to match the spoken text to a node
            const nodes = graph.getAllNodes();
            const match = voiceEngine._fuzzyMatchNode(text, nodes);

            if (match) {
                const select = target === 'source' ? $('#source-select') : $('#dest-select');
                select.value = match.id;
                showToast(`${target === 'source' ? 'Source' : 'Destination'} set to: ${match.name}`, 'success');
                voiceEngine.speak(`${match.name} selected as ${target}`);
            } else {
                showToast(`Could not find a location matching "${text}"`, 'error');
                voiceEngine.speak(`Sorry, I couldn't find a location matching ${text}`);
            }
        } catch (err) {
            if (err === 'no-speech') {
                showToast('No speech detected. Try again.', 'info');
            } else if (err === 'not-allowed') {
                showToast('Microphone access denied. Please allow microphone access.', 'error');
            } else {
                showToast(`Voice error: ${err}`, 'error');
            }
        } finally {
            btn.classList.remove('listening');
            setTimeout(() => $('#voice-status').classList.add('hidden'), 2000);
        }
    }

    async function handleVoiceCommand() {
        if (!voiceEngine) return;

        const cmdBtn = $('#voice-command-btn');
        cmdBtn.classList.add('listening');
        const statusText = $('#voice-status-text');
        statusText.textContent = 'Listening... Say "Go from [source] to [destination]"';
        $('#voice-status').classList.remove('hidden');

        try {
            const { text } = await voiceEngine.startListening();
            statusText.textContent = `Heard: "${text}"`;

            // Parse route command
            const command = voiceEngine.parseRouteCommand(text, graph);

            if (command) {
                const srcName = graph.getNode(command.source)?.name;
                const destName = graph.getNode(command.dest)?.name;

                showToast(`Voice command: ${srcName} → ${destName}`, 'success');
                voiceEngine.speak(`Finding route from ${srcName} to ${destName}`);

                // Set dropdowns
                $('#source-select').value = command.source;
                $('#dest-select').value = command.dest;

                // Auto-find path after a short delay
                setTimeout(() => handleFindPath(), 1000);
            } else {
                showToast(`Could not understand route command: "${text}"`, 'error');
                voiceEngine.speak(`Sorry, I couldn't understand that. Try saying: go from airport to central station.`);
            }
        } catch (err) {
            if (err === 'no-speech') {
                showToast('No speech detected. Try again.', 'info');
            } else if (err === 'not-allowed') {
                showToast('Microphone access denied.', 'error');
            } else {
                showToast(`Voice error: ${err}`, 'error');
            }
        } finally {
            cmdBtn.classList.remove('listening');
            setTimeout(() => $('#voice-status').classList.add('hidden'), 2000);
        }
    }

    function startVoiceNavigation(result) {
        if (!voiceEngine || !result || result.path.length === 0) return;

        voiceNavActive = true;
        $('#voice-nav-btn').classList.add('active');
        $('#stop-voice-btn').style.display = '';
        const instrEl = $('#voice-current-instruction');

        // Generate directions
        const directions = voiceEngine.generateDirections(result.path, graph);

        instrEl.textContent = 'Starting voice navigation...';
        showToast('🔊 Voice navigation started', 'success');

        voiceEngine.speakDirections(directions, {
            delayBetween: 600,
            onStep: (i, text) => {
                instrEl.textContent = text;
                // Highlight current step in the route panel
                const steps = $$('.route-step');
                steps.forEach((s, idx) => {
                    s.classList.toggle('voice-active', idx === i - 1);
                });
            }
        }).then(() => {
            voiceNavActive = false;
            $('#voice-nav-btn').classList.remove('active');
            $('#stop-voice-btn').style.display = 'none';
            instrEl.textContent = 'Navigation complete! ✅';
        });
    }

    function stopVoiceNavigation() {
        if (voiceEngine) voiceEngine.stopSpeaking();
        voiceNavActive = false;
        $('#voice-nav-btn').classList.remove('active');
        $('#stop-voice-btn').style.display = 'none';
        const instrEl = $('#voice-current-instruction');
        if (instrEl) instrEl.textContent = 'Voice navigation stopped.';
        showToast('Voice navigation stopped', 'info');
    }

    // ============ Admin Page ============
    function setupAdminPage() {
        // Add Node form
        $('#add-node-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = $('#node-name-input').value.trim();
            const x = parseInt($('#node-x-input').value) || 0;
            const y = parseInt($('#node-y-input').value) || 0;
            if (!name) return;

            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (graph.addNode(id, name, x, y)) {
                saveGraph();
                refreshAdminPage();
                populateDropdowns();
                updateStats();
                showToast(`Added location: ${name}`, 'success');
                $('#add-node-form').reset();
            } else {
                showToast('Location already exists or invalid', 'error');
            }
        });

        // Add Edge form
        $('#add-edge-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const source = $('#edge-source-select').value;
            const dest = $('#edge-dest-select').value;
            const weight = parseFloat($('#edge-weight-input').value) || 1;
            const oneWay = $('#edge-oneway-input').checked;

            if (!source || !dest) {
                showToast('Select both source and destination', 'error');
                return;
            }

            if (source === dest) {
                showToast('Source and destination must be different', 'error');
                return;
            }

            if (graph.addEdge(source, dest, weight, oneWay)) {
                saveGraph();
                refreshAdminPage();
                updateStats();
                showToast(`Added road: ${graph.getNode(source)?.name} → ${graph.getNode(dest)?.name}`, 'success');
                $('#add-edge-form').reset();
            } else {
                showToast('Road already exists or invalid', 'error');
            }
        });

        // Reset to default
        $('#reset-graph-btn').addEventListener('click', () => {
            if (confirm('Reset graph to default city data? This will erase all changes.')) {
                graph = Graph.fromJSON(getDefaultCityData());
                trafficSim = new TrafficSimulator(graph);
                saveGraph();
                refreshAdminPage();
                populateDropdowns();
                updateStats();
                currentResult = null;
                if (mainViz) {
                    mainViz.graph = graph;
                    mainViz.clearHighlights();
                }
                showToast('Graph reset to default', 'success');
            }
        });

        // Export JSON
        $('#export-graph-btn').addEventListener('click', () => {
            const data = JSON.stringify(graph.toJSON(), null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'citynav-graph.json';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Graph exported', 'success');
        });

        // Import JSON
        $('#import-graph-btn').addEventListener('click', () => {
            $('#import-file-input').click();
        });

        $('#import-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    graph = Graph.fromJSON(data);
                    trafficSim = new TrafficSimulator(graph);
                    saveGraph();
                    refreshAdminPage();
                    populateDropdowns();
                    updateStats();
                    currentResult = null;
                    if (mainViz) {
                        mainViz.graph = graph;
                        mainViz.clearHighlights();
                    }
                    showToast('Graph imported successfully', 'success');
                } catch (err) {
                    showToast('Invalid JSON file', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    function refreshAdminPage() {
        // Nodes list
        const nodesList = $('#nodes-list');
        nodesList.innerHTML = '';
        const nodes = graph.getAllNodes();
        nodes.forEach(node => {
            const li = document.createElement('li');
            li.className = 'admin-list-item';
            li.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${node.name}</span>
                    <span class="item-meta">ID: ${node.id} · (${node.x}, ${node.y})</span>
                </div>
                <div class="item-actions">
                    <button class="item-delete-btn" data-node-id="${node.id}" title="Delete location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            nodesList.appendChild(li);
        });

        // Node delete handlers
        $$('.item-delete-btn[data-node-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.nodeId;
                const name = graph.getNode(id)?.name;
                if (confirm(`Delete location "${name}"?`)) {
                    graph.removeNode(id);
                    saveGraph();
                    refreshAdminPage();
                    populateDropdowns();
                    updateStats();
                    showToast(`Deleted: ${name}`, 'info');
                }
            });
        });

        // Edges list
        const edgesList = $('#edges-list');
        edgesList.innerHTML = '';
        const edges = graph.getAllEdges();
        edges.forEach((edge, idx) => {
            const srcName = graph.getNode(edge.source)?.name || edge.source;
            const destName = graph.getNode(edge.dest)?.name || edge.dest;
            const li = document.createElement('li');
            li.className = 'admin-list-item';
            li.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${srcName} ${edge.oneWay ? '→' : '↔'} ${destName}</span>
                    <span class="item-meta">Distance: ${edge.weight} km${edge.oneWay ? ' · One-way' : ''}</span>
                </div>
                <div class="item-actions">
                    <button class="item-delete-btn" data-edge-idx="${idx}" title="Delete road">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            edgesList.appendChild(li);
        });

        // Edge delete handlers
        $$('.item-delete-btn[data-edge-idx]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.edgeIdx);
                const edge = graph.edges[idx];
                const srcName = graph.getNode(edge?.source)?.name || '';
                const destName = graph.getNode(edge?.dest)?.name || '';
                if (confirm(`Delete road "${srcName} → ${destName}"?`)) {
                    graph.removeEdgeByIndex(idx);
                    saveGraph();
                    refreshAdminPage();
                    updateStats();
                    showToast(`Deleted road`, 'info');
                }
            });
        });

        // Counts
        $('#admin-node-count').textContent = nodes.length;
        $('#admin-edge-count').textContent = edges.length;

        // Admin edge dropdowns
        populateAdminEdgeDropdowns();

        // Admin graph preview
        if (!adminViz) {
            adminViz = new GraphVisualization('#admin-graph-svg', graph, { animate: false });
        } else {
            adminViz.graph = graph;
            adminViz.refresh();
        }
    }

    function populateAdminEdgeDropdowns() {
        const nodes = graph.getAllNodes();
        ['#edge-source-select', '#edge-dest-select'].forEach(sel => {
            const select = $(sel);
            const val = select.value;
            select.innerHTML = '<option value="">Select...</option>';
            nodes.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n.id;
                opt.textContent = n.name;
                select.appendChild(opt);
            });
            select.value = val;
        });
    }

    // ============ Shared Helpers ============

    function populateDropdowns() {
        const nodes = graph.getAllNodes();
        ['#source-select', '#dest-select'].forEach(sel => {
            const select = $(sel);
            const val = select.value;
            select.innerHTML = '<option value="">Choose location...</option>';
            nodes.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n.id;
                opt.textContent = n.name;
                select.appendChild(opt);
            });
            select.value = val;
        });
    }

    function updateStats() {
        const nodes = graph.getAllNodes();
        const edges = graph.getAllEdges();
        const statNodes = $('#stat-nodes .stat-number');
        const statEdges = $('#stat-edges .stat-number');
        if (statNodes) animateNumber(statNodes, nodes.length);
        if (statEdges) animateNumber(statEdges, edges.length);
    }

    function animateNumber(el, target) {
        const start = parseInt(el.textContent) || 0;
        const duration = 600;
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    function formatTime(distKm) {
        // Assume average speed 40 km/h
        const hours = distKm / 40;
        const mins = Math.round(hours * 60);
        if (mins < 60) return `${mins} min`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }

    function showLoading() {
        $('#loading-overlay').classList.remove('hidden');
    }

    function hideLoading() {
        $('#loading-overlay').classList.add('hidden');
    }

    function showToast(message, type = 'info') {
        const container = $('#toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function generateHeroBgAnimation() {
        const container = $('#hero-bg-animation');
        if (!container) return;

        // Create floating nodes
        for (let i = 0; i < 15; i++) {
            const node = document.createElement('div');
            node.className = 'bg-node';
            const size = 10 + Math.random() * 40;
            node.style.width = size + 'px';
            node.style.height = size + 'px';
            node.style.left = Math.random() * 100 + '%';
            node.style.top = Math.random() * 100 + '%';
            node.style.animationDelay = (Math.random() * 10) + 's';
            node.style.animationDuration = (15 + Math.random() * 15) + 's';
            container.appendChild(node);
        }

        // Create sliding lines
        for (let i = 0; i < 8; i++) {
            const line = document.createElement('div');
            line.className = 'bg-line';
            line.style.width = (100 + Math.random() * 200) + 'px';
            line.style.top = Math.random() * 100 + '%';
            line.style.animationDelay = (Math.random() * 10) + 's';
            line.style.animationDuration = (10 + Math.random() * 10) + 's';
            container.appendChild(line);
        }
    }

    // ============ Start ============
    document.addEventListener('DOMContentLoaded', init);

})();
