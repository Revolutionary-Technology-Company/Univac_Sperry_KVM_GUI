/**
 * Dorado Mainframe VST Allocation Control Module
 * Designed for Revolutionary-Technology-Company/Univac_Sperry_KVM_GUI
 * Coordinates with Univac-Aegis-bridge to alter Dorado instruction blocks.
 */

export class DoradoVstKnob extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Default Config mimicking Unisys Dorado Metered Pay-For-Use parameters
        this.minMips = 10;
        this.maxMips = 1200;
        this.currentMips = 10;
        this.isDragging = false;
        this.startY = 0;
        this.startMips = 10;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    background: #111;
                    border: 2px solid rgb(196, 214, 77);
                    border-radius: 8px;
                    padding: 15px;
                    width: 140px;
                    text-align: center;
                    font-family: monospace;
                    user-select: none;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                }
                .vst-title {
                    font-size: 10px;
                    color: #aaa;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                    letter-spacing: 1px;
                }
                .knob-container {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto;
                    cursor: ns-resize;
                }
                .knob-dial {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: radial-gradient(circle, #333 40%, #222 70%);
                    border: 4px solid #444;
                    position: relative;
                    transform: rotate(0deg);
                    transition: transform 0.05s linear;
                }
                .knob-marker {
                    position: absolute;
                    top: 5px;
                    left: 50%;
                    width: 4px;
                    height: 15px;
                    background-color: rgb(196, 214, 77);
                    transform: translateX(-50%);
                    border-radius: 2px;
                }
                .vst-display {
                    margin-top: 12px;
                    background: #000;
                    border: 1px solid #333;
                    border-radius: 4px;
                    padding: 4px;
                    font-size: 14px;
                    color: rgb(196, 214, 77);
                    font-weight: bold;
                }
                .vst-unit {
                    font-size: 9px;
                    color: #666;
                    margin-top: 2px;
                }
            </style>
            <div class="vst-title">Dorado MIPS</div>
            <div class="knob-container" id="knobContainer">
                <div class="knob-dial" id="knobDial">
                    <div class="knob-marker"></div>
                </div>
            </div>
            <div class="vst-display" id="displayVal">0010</div>
            <div class="vst-unit">OS 2200 ALLOC</div>
        `;
    }

    setupEventListeners() {
        const container = this.shadowRoot.getElementById('knobContainer');
        
        // Touch and Mouse tracking for relative horizontal/vertical sliding
        container.addEventListener('mousedown', (e) => this.startInteraction(e.clientY));
        window.addEventListener('mousemove', (e) => this.handleInteraction(e.clientY));
        window.addEventListener('mouseup', () => this.stopInteraction());

        container.addEventListener('touchstart', (e) => {
            this.startInteraction(e.touches[0].clientY);
            e.preventDefault();
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            this.handleInteraction(e.touches[0].clientY);
        }, { passive: false });
        window.addEventListener('touchend', () => this.stopInteraction());
    }

    startInteraction(clientY) {
        this.isDragging = true;
        this.startY = clientY;
        this.startMips = this.currentMips;
    }

    handleInteraction(clientY) {
        if (!this.isDragging) return;

        // Calculate delta: drag up to increase capacity, down to throttle
        const deltaY = this.startY - clientY;
        const sensitivity = 2.5; // Change rate scaling
        let calculatedMips = Math.round(this.startMips + (deltaY * sensitivity));

        // Constrain bounds to valid processing ranges
        calculatedMips = Math.max(this.minMips, Math.min(this.maxMips, calculatedMips));
        
        if (calculatedMips !== this.currentMips) {
            this.currentMips = calculatedMips;
            this.updateUi();
            this.dispatchDmaWrite();
        }
    }

    stopInteraction() {
        if (this.isDragging) {
            this.isDragging = false;
            this.commitConfigSync();
        }
    }

    updateUi() {
        const dial = this.shadowRoot.getElementById('knobDial');
        const display = this.shadowRoot.getElementById('displayVal');

        // Map MIPS values linearly to a classic VST rotational envelope (-135 to +135 deg)
        const percent = (this.currentMips - this.minMips) / (this.maxMips - this.minMips);
        const rotation = (percent * 270) - 135;
        
        dial.style.transform = `rotate(${rotation}deg)`;
        display.textContent = String(this.currentMips).padStart(4, '0');
    }

    /**
     * Dispatches Direct Memory Access write updates straight to the local bridge API
     */
    async dispatchDmaWrite() {
        try {
            await fetch('http://localhost:8081/api/bridge/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reg: "DORADO_MIPS_REG",
                    val: this.currentMips
                })
            });
        } catch (err) {
            // Silently buffer networking errors inside the KVM runtime context
            console.debug('Bridge DMA sink unreached:', err);
        }
    }

    /**
     * Commits final configurations into the localized telecom data stream pipelines
     */
    async commitConfigSync() {
        // Dispatches global framework notification for custom storage synchronization
        this.dispatchEvent(new CustomEvent('dorado-mips-sync', {
            detail: { mips: this.currentMips },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dorado-vst-knob', DoradoVstKnob);
