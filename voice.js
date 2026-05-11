/* =============================================
   CityNav — Voice Engine
   Text-to-Speech (Navigation) + Speech-to-Text (Input)
   Uses Web Speech API (browser built-in)
   ============================================= */

class VoiceEngine {
    constructor() {
        this.synth = window.speechSynthesis || null;
        this.recognition = null;
        this.isSpeaking = false;
        this.isListening = false;
        this.currentUtterance = null;
        this.voiceQueue = [];
        this.onRecognitionResult = null;
        this.onListeningChange = null;
        this.selectedVoice = null;

        this._initRecognition();
        this._loadVoice();
    }

    // ============ Text-to-Speech (Navigation) ============

    /**
     * Speak a single text string
     */
    speak(text, options = {}) {
        if (!this.synth) {
            console.warn('SpeechSynthesis not supported in this browser');
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            // Cancel any current speech if not queuing
            if (!options.queue) {
                this.synth.cancel();
                this.voiceQueue = [];
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = options.lang || 'en-US';
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;

            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            }

            utterance.onstart = () => {
                this.isSpeaking = true;
                this.currentUtterance = utterance;
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                resolve();
            };

            utterance.onerror = (e) => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                if (e.error !== 'canceled') {
                    console.warn('Speech error:', e.error);
                }
                resolve();
            };

            this.synth.speak(utterance);
        });
    }

    /**
     * Speak route directions step by step with delays
     */
    async speakDirections(directions, options = {}) {
        const delay = options.delayBetween || 800;
        const onStep = options.onStep || (() => {});

        for (let i = 0; i < directions.length; i++) {
            if (!this.isSpeaking && i > 0) {
                // User stopped, exit
                break;
            }
            onStep(i, directions[i]);
            await this.speak(directions[i]);
            if (i < directions.length - 1) {
                await this._wait(delay);
            }
        }
    }

    /**
     * Generate natural-language directions from a path result
     */
    generateDirections(path, graph) {
        if (!path || path.length === 0) return [];

        const directions = [];
        const startNode = graph.getNode(path[0]);
        const endNode = graph.getNode(path[path.length - 1]);

        // Intro
        directions.push(
            `Starting navigation from ${startNode?.name || path[0]} to ${endNode?.name || path[path.length - 1]}.`
        );

        // Each step
        for (let i = 0; i < path.length - 1; i++) {
            const from = graph.getNode(path[i]);
            const to = graph.getNode(path[i + 1]);

            // Find edge weight
            const edge = graph.edges.find(e =>
                (e.source === path[i] && e.dest === path[i + 1]) ||
                (!e.oneWay && e.source === path[i + 1] && e.dest === path[i])
            );
            const dist = edge ? edge.weight : '?';

            if (i === 0) {
                directions.push(
                    `Head towards ${to?.name || path[i + 1]}. Distance: ${dist} kilometers.`
                );
            } else if (i === path.length - 2) {
                directions.push(
                    `Continue to your destination, ${to?.name || path[i + 1]}. ${dist} kilometers remaining.`
                );
            } else {
                // Generate directional hints based on coordinates
                const dirHint = this._getDirectionHint(from, to);
                directions.push(
                    `${dirHint}Proceed to ${to?.name || path[i + 1]}. ${dist} kilometers.`
                );
            }
        }

        // Total distance
        let totalDist = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const edge = graph.edges.find(e =>
                (e.source === path[i] && e.dest === path[i + 1]) ||
                (!e.oneWay && e.source === path[i + 1] && e.dest === path[i])
            );
            if (edge) totalDist += edge.weight;
        }

        directions.push(
            `You have arrived at ${endNode?.name || path[path.length - 1]}. Total distance: ${totalDist} kilometers. Estimated time: ${this._formatTimeVoice(totalDist)}.`
        );

        return directions;
    }

    /**
     * Stop all speech
     */
    stopSpeaking() {
        if (this.synth) {
            this.synth.cancel();
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.voiceQueue = [];
    }


    // ============ Speech-to-Text (Voice Input) ============

    /**
     * Start listening for speech input
     * Returns a promise that resolves with the recognized text
     */
    startListening(options = {}) {
        if (!this.recognition) {
            console.warn('SpeechRecognition not supported in this browser');
            return Promise.reject('Speech recognition not supported');
        }

        return new Promise((resolve, reject) => {
            if (this.isListening) {
                this.recognition.stop();
            }

            this.recognition.lang = options.lang || 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 3;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase().trim();
                const confidence = event.results[0][0].confidence;
                this.isListening = false;
                if (this.onListeningChange) this.onListeningChange(false);
                resolve({ text: transcript, confidence });
            };

            this.recognition.onerror = (event) => {
                this.isListening = false;
                if (this.onListeningChange) this.onListeningChange(false);
                reject(event.error);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.onListeningChange) this.onListeningChange(false);
            };

            this.recognition.onstart = () => {
                this.isListening = true;
                if (this.onListeningChange) this.onListeningChange(true);
            };

            try {
                this.recognition.start();
            } catch (e) {
                reject(e.message);
            }
        });
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    /**
     * Parse a voice command like "go from airport to mall" or "navigate central station to park"
     * Returns { source: string, dest: string } or null
     */
    parseRouteCommand(text, graph) {
        const nodes = graph.getAllNodes();
        text = text.toLowerCase().trim();

        // Common patterns:
        // "go from X to Y"
        // "navigate from X to Y"
        // "find route from X to Y"
        // "X to Y"
        // "from X to Y"

        // Try "from ... to ..." pattern
        const fromToMatch = text.match(/(?:go |navigate |find |route |path )?(?:from )?(.+?)\s+to\s+(.+)/i);
        if (fromToMatch) {
            const sourceText = fromToMatch[1].replace(/^(?:from |the )/, '').trim();
            const destText = fromToMatch[2].replace(/^(?:the )/, '').trim();

            const source = this._fuzzyMatchNode(sourceText, nodes);
            const dest = this._fuzzyMatchNode(destText, nodes);

            if (source && dest) {
                return { source: source.id, dest: dest.id };
            }
        }

        return null;
    }

    /**
     * Match a spoken name to the closest node using fuzzy matching
     */
    _fuzzyMatchNode(spokenName, nodes) {
        spokenName = spokenName.toLowerCase().replace(/[^a-z0-9 ]/g, '');

        // Exact match
        const exact = nodes.find(n => n.name.toLowerCase() === spokenName);
        if (exact) return exact;

        // Contains match
        const contains = nodes.find(n =>
            n.name.toLowerCase().includes(spokenName) ||
            spokenName.includes(n.name.toLowerCase())
        );
        if (contains) return contains;

        // ID match
        const idMatch = nodes.find(n => n.id === spokenName.replace(/\s+/g, ''));
        if (idMatch) return idMatch;

        // Word overlap match — score each node
        const spokenWords = spokenName.split(/\s+/);
        let bestScore = 0;
        let bestNode = null;

        for (const node of nodes) {
            const nodeWords = node.name.toLowerCase().split(/\s+/);
            let score = 0;
            for (const sw of spokenWords) {
                for (const nw of nodeWords) {
                    if (nw.includes(sw) || sw.includes(nw)) {
                        score += sw.length;
                    }
                    // Levenshtein-like: first 3 chars match
                    if (sw.length >= 3 && nw.length >= 3 && sw.substring(0, 3) === nw.substring(0, 3)) {
                        score += 2;
                    }
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestNode = node;
            }
        }

        return bestScore >= 3 ? bestNode : null;
    }

    // ============ Helpers ============

    _initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
        }
    }

    _loadVoice() {
        if (!this.synth) return;

        const loadVoices = () => {
            const voices = this.synth.getVoices();
            // Prefer a natural English voice
            this.selectedVoice =
                voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
                voices.find(v => v.lang.startsWith('en-US')) ||
                voices.find(v => v.lang.startsWith('en')) ||
                voices[0] || null;
        };

        loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    _getDirectionHint(fromNode, toNode) {
        if (!fromNode || !toNode) return '';
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Simple 8-direction
        if (angle > -22.5 && angle <= 22.5) return 'Head east. ';
        if (angle > 22.5 && angle <= 67.5) return 'Head southeast. ';
        if (angle > 67.5 && angle <= 112.5) return 'Head south. ';
        if (angle > 112.5 && angle <= 157.5) return 'Head southwest. ';
        if (angle > 157.5 || angle <= -157.5) return 'Head west. ';
        if (angle > -157.5 && angle <= -112.5) return 'Head northwest. ';
        if (angle > -112.5 && angle <= -67.5) return 'Head north. ';
        if (angle > -67.5 && angle <= -22.5) return 'Head northeast. ';
        return '';
    }

    _formatTimeVoice(distKm) {
        const hours = distKm / 40;
        const mins = Math.round(hours * 60);
        if (mins < 60) return `${mins} minutes`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h} hour${h > 1 ? 's' : ''} and ${m} minutes` : `${h} hour${h > 1 ? 's' : ''}`;
    }

    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check browser support
     */
    static isSupported() {
        return {
            synthesis: 'speechSynthesis' in window,
            recognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
        };
    }
}
