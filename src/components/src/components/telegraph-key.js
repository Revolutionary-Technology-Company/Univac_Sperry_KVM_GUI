/**
 * Touch-Screen Optimized Morse Code Telegraph Key
 * Converts raw tap durations into live alphanumeric character buffers.
 */
export class MorseTelegraphKey {
    constructor(targetId, characterBufferCallback) {
        this.wrapper = document.getElementById(targetId);
        this.callback = characterBufferCallback;

        // Morse Code Timing Constants (Normalized based on a 20 WPM baseline standard)
        this.DOT_MAX_DURATION = 150;  // Taps under 150ms = Dit
        this.LETTER_GAP_TIMEOUT = 450; // Pause over 450ms = End of active letter string character

        // Working State Variables
        this.pressStartTime = 0;
        this.gapTimer = null;
        this.currentMorseWord = "";
        this.compiledOutputString = "";

        // International Morse Code Dictionary Map
        this.morseDictionary = {
            ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F",
            "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L",
            "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R",
            "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X",
            "-.--": "Y", "--..": "Z", "-----": "0", ".----": "1", "..---": "2",
            "...--": "3", "....-": "4", ".....": "5", "-....": "6", "--...": "7",
            "---..": "8", "----.": "9"
        };

        // Web Audio Context for authentic radio sidetone generation
        this.audioCtx = null;

        this.render();
    }

    render() {
        this.wrapper.innerHTML = `
            <div class="telegraph-key-assembly">
                <span class="vst-ctrl-label">MORSE TELEGRAPH KEYER</span>
                
                <div class="telegraph-workspace-grid">
                    <!-- The Interactive Mechanical Lever Touch Area -->
                    <div class="telegraph-lever-hitbox" id="keyer-lever-target">
                        <div class="telegraph-arm-bar"></div>
                        <div class="telegraph-finger-knob"></div>
                    </div>

                    <!-- Live Character Stream Readout Buffers -->
                    <div class="telegraph-readout-deck">
                        <div class="morse-symbol-track" id="morse-symbols-view">AWAITING INPUT...</div>
                        <input type="text" class="telegraph-string-output" id="telegraph-buffer-out" readonly value="">
                    </div>
                </div>
            </div>
        `;

        this.bindTouchMechanics();
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSidetone(frequency = 800) {
        this.initAudio();
        if (!this.audioCtx) return;

        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();

        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = frequency; // Standard high-pitch radio CW note tone
        
        this.gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime); // Prevent clipping distortions
        
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        this.oscillator.start();
    }

    stopSidetone() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }

    bindTouchMechanics() {
        const lever = this.wrapper.querySelector('#keyer-lever-target');
        
        // Touch Screen Event Pipes
        lever.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleKeyDown();
        }, { passive: false });

        lever.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleKeyUp();
        }, { passive: false });

        // Desktop Mouse Test Environments Fallbacks
        lever.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleKeyDown();
        });
        window.addEventListener('mouseup', () => {
            this.handleKeyUp();
        });
    }

    handleKeyDown() {
        clearTimeout(this.gapTimer);
        this.leverVisualState(true);
        this.playSidetone();
        this.pressStartTime = Date.now();
    }

    handleKeyUp() {
        if (this.pressStartTime === 0) return;
        
        this.leverVisualState(false);
        this.stopSidetone();

        const duration = Date.now() - this.pressStartTime;
        this.pressStartTime = 0;

        // Process duration into standard symbols
        const symbol = (duration <= this.DOT_MAX_DURATION) ? "." : "-";
        this.currentMorseWord += symbol;

        // Render current symbols string directly to tracking readout area
        const symbolsView = this.wrapper.querySelector('#morse-symbols-view');
        if (symbolsView) symbolsView.textContent = this.currentMorseWord;

        // Start pause gap countdown timer to capture word string termination breakpoints
        this.gapTimer = setTimeout(() => {
            this.evaluateMorseLetter();
        }, this.LETTER_GAP_TIMEOUT);
    }

    evaluateMorseLetter() {
        const translatedChar = this.morseDictionary[this.currentMorseWord] || "?";
        this.currentMorseWord = ""; // Clear working symbol tracking loop register

        if (translatedChar !== "?") {
            this.compiledOutputString += translatedChar;
            const outputField = this.wrapper.querySelector('#telegraph-buffer-out');
            if (outputField) {
                outputField.value = this.compiledOutputString;
                // Auto scroll readout to show tail end characters clearly on mobile widths
                outputField.scrollLeft = outputField.scrollWidth;
            }

            // Fire character notification callbacks up into your KVM and config data log channels
            if (this.callback) {
                this.callback(this.compiledOutputString, translatedChar);
            }
        }

        const symbolsView = this.wrapper.querySelector('#morse-symbols-view');
        if (symbolsView) symbolsView.textContent = "READY";
    }

    leverVisualState(isPressed) {
        const lever = this.wrapper.querySelector('#keyer-lever-target');
        if (!lever) return;
        if (isPressed) {
            lever.classList.add('lever-contact-closed');
        } else {
            lever.classList.remove('lever-contact-closed');
        }
    }

    /**
     * Clear and reset output tracking arrays
     */
    clearBuffer() {
        this.compiledOutputString = "";
        const outputField = this.wrapper.querySelector('#telegraph-buffer-out');
        if (outputField) outputField.value = "";
    }
}
