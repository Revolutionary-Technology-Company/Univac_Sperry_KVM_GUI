/**
 * Sperry Univac RAW Telecom vCard (.vcf) Phone Book Export Factory.
 * Converts saved Gantry templates into Android-compatible contact listings.
 */
export class VCardTelecomFactory {
    constructor() {
        // Frequency and tone mappings extracted directly from the Crandall Morse specifications
        this.toneFrequencyMap = {
            '.': '1200', // Short base frequency tone (Hz)
            '-': '800',  // Long base frequency tone (Hz)
            ' ': '0'     // Inter-character element space pause
        };
    }

    /**
     * Converts a Gantry template compilation stack into a RAW telecom .vcf file string
     * @param {Object} gantryTemplate - The stack metadata payload generated from the builder canvas
     */
    generateVcfString(gantryTemplate) {
        const styleName = gantryTemplate.templateStyleName.toUpperCase();
        const targetNode = gantryTemplate.targetNode.toUpperCase();
        const morseString = gantryTemplate.compiledMorseString;

        // Convert the raw Latin-Morse dot-dash string into its specific tone frequency number chain
        const toneNumberColumn = this.convertToFrequencyToneNumber(morseString);

        // Build a structural, multi-column Android vCard schema string
        let vcf = "BEGIN:VCARD\r\n";
        vcf += "VERSION:3.0\r\n";
        vcf += `N:${styleName};UNIVAC;MACRO;;${targetNode}\r\n`;
        vcf += `FN:UNIVAC OPERATOR - ${styleName}\r\n`;
        vcf += `ORG:Sperry Univac Mainframe Node Array;Aegis Bridge System\r\n`;
        
        // The phone number column specifically houses the raw telecom tone-frequency instruction set
        vcf += `TEL;TYPE=WORK,VOICE,RAW_TELECOM:${toneNumberColumn}\r\n`;
        
        // Map historical museum configurations and operational notes into standard note cards
        vcf += `NOTE;CHARSET=UTF-8:UNIVAC CODE VECTOR STREAM\\n`;
        vcf += `Node Target: ${targetNode}\\n`;
        vcf += `Morse Sequence: ${morseString}\\n`;
        vcf += `NVIDIA Execution Compute Layer Verified\\n`;
        vcf += `Timestamp: ${gantryTemplate.timestamp}\r\n`;
        
        // Append all operational data items structurally inside the contact's title slot
        vcf += `TITLE:Instruction Count [${gantryTemplate.instructionCount}] - Priority Queue Protected\r\n`;
        vcf += "END:VCARD\r\n";

        return vcf;
    }

    /**
     * Translates a Morse code sequence into a continuous raw tone frequency string for the phone number column
     */
    convertToFrequencyToneNumber(morseString) {
        let numberSequence = "";
        for (let i = 0; i < morseString.length; i++) {
            const token = morseString[i];
            const mappedTone = this.toneFrequencyMap[token];
            if (mappedTone) {
                numberSequence += (numberSequence === "" ? "" : ",") + mappedTone;
            }
        }
        return numberSequence; // Outputs e.g., "1200,800,1200" corresponding to specific commands
    }

    /**
     * Triggers a browser disk download prompt for the phone book .vcf asset file
     */
    downloadVcfAsset(gantryTemplate) {
        const rawContent = this.generateVcfString(gantryTemplate);
        const dataBlob = new Blob([rawContent], { type: 'text/vcard;charset=utf-8;' });
        const objectUrl = URL.createObjectURL(dataBlob);
        
        const fileAnchor = document.createElement('a');
        fileAnchor.href = objectUrl;
        fileAnchor.setAttribute("download", `${gantryTemplate.templateStyleName.toLowerCase()}_telecom_raw.vcf`);
        document.body.appendChild(fileAnchor);
        
        fileAnchor.click();
        fileAnchor.remove();
        URL.revokeObjectURL(objectUrl);
        console.log("📁 RAW Telecom Phone Book Address Card generated and exported to Android vCard.");
    }
}
