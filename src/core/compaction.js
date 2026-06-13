/**
 * Univac 1100 Series Fieldata 6-Bit Compaction Protocol Engine
 * Packs multiple text characters into standard dense mainframe memory blocks.
 */
export class MainframeCompaction {
    constructor() {
        // Precise Historical Univac Fieldata 6-Bit Character Set Mapping Array (0x00 to 0x3F)
        // Mapped to fit 64 total uppercase characters, numbers, and critical syntax layout symbols.
        this.fieldataSet = [
            '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
            'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4',
            '5', '6', '7', '8', '9', ' ', '$', '/', ',', '.', '-', '?', ':', '\'', '(', ')',
            '+', '-', '*', '=', ':', ';', '<', '>', '[', ']', '%', '#', '!', '&', '"', '_'
        ];
    }

    /**
     * Translates a standard string into a 6-bit index array, stripping invalid tokens.
     */
    stringToFieldataBytes(rawText) {
        const upperText = rawText.toUpperCase();
        const fieldataBytes = [];

        for (let i = 0; i < upperText.length; i++) {
            const char = upperText[i];
            const index = this.fieldataSet.indexOf(char);
            
            // If character exists in Fieldata table, push its 6-bit value, else substitute with space
            fieldataBytes.push(index !== -1 ? index : 0x1B); 
        }

        return fieldataBytes;
    }

    /**
     * Compacts a 6-bit stream into modern 8-bit typed arrays for low-latency network transfer.
     * Packs 4 Fieldata characters (4 * 6 = 24 bits) into exactly 3 standard 8-bit bytes (3 * 8 = 24 bits).
     */
    compactStringToMessageBlock(rawText) {
        const sixBitBytes = this.stringToFieldataBytes(rawText);
        
        // Pad array with spaces (Fieldata index 0x1B) so the buffer length aligns cleanly to 4-character blocks
        while (sixBitBytes.length % 4 !== 0) {
            sixBitBytes.push(0x1B);
        }

        const blockCount = sixBitBytes.length / 4;
        const packedBuffer = new Uint8Array(blockCount * 3); // 3 bytes out for every 4 characters in

        let outIdx = 0;
        for (let i = 0; i < sixBitBytes.length; i += 4) {
            const c0 = sixBitBytes[i];
            const c1 = sixBitBytes[i+1];
            const c2 = sixBitBytes[i+2];
            const c3 = sixBitBytes[i+3];

            // Perform logical bit-shifting maneuvers to pack 24 clean continuous data bits
            packedBuffer[outIdx]     = (c0 << 2) | (c1 >> 4);          // Byte 1: 6 bits of c0 + top 2 bits of c1
            packedBuffer[outIdx + 1] = ((c1 & 0x0F) << 4) | (c2 >> 2); // Byte 2: Lower 4 bits of c1 + top 4 bits of c2
            packedBuffer[outIdx + 2] = ((c2 & 0x03) << 6) | c3;         // Byte 3: Lower 2 bits of c2 + 6 bits of c3
            
            outIdx += 3;
        }

        // Return packed block structured as a hex payload string for easy bridge transport
        return {
            rawCharCount: rawText.length,
            packedBlockCount: blockCount,
            hexPayload: Array.from(packedBuffer).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
        };
    }

    /**
     * Unpacks a telemetry hex stream back into standard text layout arrays for troubleshooting
     */
    unpackMessageBlockToText(hexPayload) {
        if (!hexPayload || hexPayload.length % 6 !== 0) return "[TELEGRAM DECOMPRESSION ERROR]";
        
        const bytes = hexPayload.match(/.{1,2}/g).map(hex => parseInt(hex, 16));
        let decodedText = "";

        for (let i = 0; i < bytes.length; i += 3) {
            const b0 = bytes[i];
            const b1 = bytes[i+1];
            const b2 = bytes[i+2];

            // Reverse bit shifts to re-extract 6-bit pieces
            const c0 = b0 >> 2;
            const c1 = ((b0 & 0x03) << 4) | (b1 >> 4);
            const c2 = ((b1 & 0x0F) << 2) | (b2 >> 6);
            const c3 = b2 & 0x3F;

            decodedText += this.fieldataSet[c0] + this.fieldataSet[c1] + this.fieldataSet[c2] + this.fieldataSet[c3];
        }

        return decodedText.trimEnd();
    }
}
