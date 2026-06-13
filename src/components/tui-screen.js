/**
 * Sperry Univac UTS Block-Mode TUI Matrix Renderer
 * Simulates a local hardware screen buffer and fields template.
 */
export class SperryTuiScreen {
    constructor(containerId, bridgeClient) {
        this.container = document.getElementById(containerId);
        this.bridge = bridgeClient;

        // Screen Dimensions
        this.COLS = 80;
        this.ROWS = 25; // Row 25 (Index 24) is the dedicated Hardware Status Line

        // Local Memory Buffers
        this.charBuffer = [];  // 2D Array [row][col] storing strings
        this.attrBuffer = [];  // 2D Array [row][col] storing metadata ('protected', 'input', 'status')

        // Cursor State
        this.cursorRow = 0;
        this.cursorCol = 0;

        // Hardware Flag
        this.keyboardLocked = false;

        this.initBuffers();
        this.setupKeyboardHook();
    }

    /**
     * Initializes blank 80x25 grids for character matrix data and cell properties
     */
    initBuffers() {
        this.charBuffer = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(' '));
        this.attrBuffer = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill('protected'));

        // Reserve Row 25 (Index 24) for system hardware reporting 
        for (let c = 0; c < this.COLS; c++) {
            this.attrBuffer[24][c] = 'status';
        }
        this.writeStatusLine("SYSTEM READY - SPERRY UNIVAC 1100 INTERFACE");
    }

    /**
     * Helper to load template forms onto the local workspace terminal
     */
    defineField(row, colStart, text, type = 'protected') {
        for (let i = 0; i < text.length; i++) {
            const targetCol = colStart + i;
            if (targetCol < this.COLS) {
                this.charBuffer[row][targetCol] = text[i];
                this.attrBuffer[row][targetCol] = type;
            }
        }
    }

    /**
     * Renders text to the dedicated 25th row
     */
    writeStatusLine(message) {
        const standardMsg = message.padEnd(65, ' ');
        for (let i = 0; i < standardMsg.length; i++) {
            this.charBuffer[24][i] = standardMsg[i];
        }
        this.updateCoordsOnStatus();
    }

    updateCoordsOnStatus() {
        const coordString = `R:${String(this.cursorRow + 1).padStart(2, '0')} C:${String(this.cursorCol + 1).padStart(2, '0')}`;
        for (let i = 0; i < coordString.length; i++) {
            this.charBuffer[24][68 + i] = coordString[i];
        }
    }

    /**
     * Low-latency Virtual DOM Grid Renderer
     */
    render() {
        let htmlStr = "";
        for (let r = 0; r < this.ROWS; r++) {
            htmlStr += `<div class="tui-row">`;
            for (let c = 0; c < this.COLS; c++) {
                const char = this.charBuffer[r][c];
                const attr = this.attrBuffer[r][c];
                const isCursor = (r === this.cursorRow && c === this.cursorCol && !this.keyboardLocked);
                
                const cursorClass = isCursor ? ' sperry-cursor' : '';
                const displayChar = char === ' ' ? '&nbsp;' : char;

                htmlStr += `<span class="tui-cell tui-attr-${attr}${cursorClass}">${displayChar}</span>`;
            }
            htmlStr += `</div>`;
        }
        this.container.innerHTML = htmlStr;
    }

    /**
     * Intercepts keystrokes for local execution. Mainframe is blind until XMIT triggers.
     */
    setupKeyboardHook() {
        window.addEventListener('keydown', (e) => {
            // Drop input processing if UI layer or navigation tabs took priority
            if (!this.container.closest('.kvm-screen-pane').classList.contains('active')) return;
            if (this.keyboardLocked) return;

            if (e.key === 'Tab') {
                e.preventDefault();
                this.advanceToNextField(e.shiftKey);
                this.render();
                return;
            }

            if (e.key === 'Backspace') {
                e.preventDefault();
                this.handleBackspace();
                this.render();
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                this.transmitLocalBuffer(); // Mimics physical XMIT button activation
                return;
            }

            // Route standard typographic characters into local text array fields
            if (e.key.length === 1) {
                this.handleCharacterInput(e.key);
                this.render();
            }
        });
    }

    handleCharacterInput(char) {
        // Assert write target falls inside user-writable inputs
        if (this.attrBuffer[this.cursorRow][this.cursorCol] === 'input') {
            this.charBuffer[this.cursorRow][this.cursorCol] = char.toUpperCase();
            this.advanceCursor();
        } else {
            // Sound warning tone or shift focus automatically to the next input array space
            this.advanceToNextField(false);
            if (this.attrBuffer[this.cursorRow][this.cursorCol] === 'input') {
                this.charBuffer[this.cursorRow][this.cursorCol] = char.toUpperCase();
                this.advanceCursor();
            }
        }
        this.updateCoordsOnStatus();
    }

    handleBackspace() {
        this.regressCursor();
        if (this.attrBuffer[this.cursorRow][this.cursorCol] === 'input') {
            this.charBuffer[this.cursorRow][this.cursorCol] = ' ';
        }
        this.updateCoordsOnStatus();
    }

    advanceCursor() {
        this.cursorCol++;
        if (this.cursorCol >= this.COLS) {
            this.cursorCol = 0;
            this.cursorRow++;
            if (this.cursorRow >= this.ROWS - 1) { // Stop at Row 24 to preserve Status line
                this.cursorRow = 0;
            }
        }
    }

    regressCursor() {
        this.cursorCol--;
        if (this.cursorCol < 0) {
            this.cursorCol = this.COLS - 1;
            this.cursorRow--;
            if (this.cursorRow < 0) {
                this.cursorRow = this.ROWS - 2;
            }
        }
    }

    advanceToNextField(reverse = false) {
        let iterations = 0;
        const maxSearch = this.COLS * (this.ROWS - 1);
        
        while (iterations < maxSearch) {
            if (reverse) {
                this.cursorCol--;
                if (this.cursorCol < 0) {
                    this.cursorCol = this.COLS - 1;
                    this.cursorRow--;
                    if (this.cursorRow < 0) this.cursorRow = this.ROWS - 2;
                }
            } else {
                this.cursorCol++;
                if (this.cursorCol >= this.COLS) {
                    this.cursorCol = 0;
                    this.cursorRow++;
                    if (this.cursorRow >= this.ROWS - 1) this.cursorRow = 0;
                }
            }

            if (this.attrBuffer[this.cursorRow][this.cursorCol] === 'input') {
                // Pinpoint beginnings of fields
                const prevCol = this.cursorCol === 0 ? this.COLS - 1 : this.cursorCol - 1;
                const prevRow = this.cursorCol === 0 ? (this.cursorRow === 0 ? this.ROWS - 2 : this.cursorRow - 1) : this.cursorRow;
                
                if (this.attrBuffer[prevRow][prevCol] !== 'input') {
                    break;
                }
            }
            iterations++;
        }
    }

    /**
     * XMIT Execution: Gathers unprotected text arrays and pushes them to the backend bridge
     */
    transmitLocalBuffer() {
        this.keyboardLocked = true;
        this.writeStatusLine("WAIT - TRANSMITTING BLOCK TO UNIVAC AEGIS BRIDGE...");
        this.render();

        // Extract text only from editable fields
        const payload = [];
        for (let r = 0; r < this.ROWS - 1; r++) {
            let fieldAccumulator = "";
            let fieldStartCol = null;

            for (let c = 0; c < this.COLS; c++) {
                if (this.attrBuffer[r][c] === 'input') {
                    if (fieldStartCol === null) fieldStartCol = c;
                    fieldAccumulator += this.charBuffer[r][c];
                } else {
                    if (fieldAccumulator !== "") {
                        payload.push({
                            row: r,
                            col: fieldStartCol,
                            data: fieldAccumulator.trimEnd()
                        });
                        fieldAccumulator = "";
                        fieldStartCol = null;
                    }
                }
            }
            if (fieldAccumulator !== "") {
                payload.push({ row: r, col: fieldStartCol, data: fieldAccumulator.trimEnd() });
            }
        }

        // Forward payload package directly down your bridge connection
        if (this.bridge && typeof this.bridge.sendBlockModeBurst === 'function') {
            this.bridge.sendBlockModeBurst(payload)
                .then(response => {
                    this.keyboardLocked = false;
                    this.writeStatusLine("XMIT COMPLETE - KEYBOARD UNLOCKED");
                    this.render();
                })
                .catch(err => {
                    this.keyboardLocked = false;
                    this.writeStatusLine("ERROR - TRANSMIT FAILED (CHECK BRIDGE STATUS)");
                    this.render();
                });
        } else {
            // Fallback debugging execution loop if bridge network mock handles are absent
            setTimeout(() => {
                this.keyboardLocked = false;
                this.writeStatusLine("MOCK XMIT COMPLETE - LOCAL BUFFER RESET");
                this.render();
            }, 800);
        }
    }
}
