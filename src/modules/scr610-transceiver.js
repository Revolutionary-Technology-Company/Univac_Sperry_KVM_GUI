import { VstSwitch } from '../components/vst-switch.js';
import { VstKnob } from '../components/vst-knob.js';
import { AnalogMeter } from '../components/analog-meter.js';

/**
 * Skeuomorphic Radio Set SCR-610 Controller Module.
 * Models the BC-659 Transceiver unit and PE-117 Vibrator Plate Power Supply.
 */
export class Scr610TransceiverPanel {
    constructor(containerId, bridgeClient) {
        this.container = document.getElementById(containerId);
        this.bridge = bridgeClient;
        this.controls = {};
        
        this.indicatingMeter = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="vst-console-frame olive-drab-chassis">
                <!-- Military Designation Brand Plate -->
                <div class="vst-console-header line-olive">
                    <span class="vst-brand-text">RADIO SET SCR-610</span>
                    <span class="vst-model-text">BC-659 TRANSCEIVER & VIBRATOR PLATE SUPPLY</span>
                </div>

                <div class="radio-split-workspace">
                    <!-- ======================================================= -->
                    <!-- SECTION 1: BC-659 RECEIVER AND TRANSMITTER UNIT -->
                    <!-- ======================================================= -->
                    <div class="radio-rack-column olive-well" id="scr610-receiver-transmitter">
                        <h2>BC-659 RECEIVER & TRANSMITTER ASSEMBLY</h2>
                        
                        <!-- INTEGRATED TUNING/BATTERY INDICATING METER -->
                        <div style="display: flex; margin-bottom: 12px; background-color: #1F2421; padding: 10px; border-radius: 4px; justify-content: center; border: 1px solid #141715;">
                            <div id="vst-meter-scr610-indicator"></div>
                        </div>

                        <div class="vst-zone military-border">
                            <h3>CHANNEL SELECTION (STEPPED DESIGN - PREVENTS VIRTUAL BEARING WEAR)</h3>
                            <div class="vst-grid">
                                <!-- TP 1: Fixed Preset Channel Selector A/B Click Stop Knob -->
                                <div class="vst-item" id="scr-tp-1"></div>
                                <!-- TP 2: Tuning Locking Clamp Switch -->
                                <div class="vst-item" id="scr-tp-2"></div>
                            </div>
                        </div>

                        <div class="vst-zone military-border">
                            <h3>AUDIO REGULATION & SQUELCH SENSITIVITY</h3>
                            <div class="vst-grid">
                                <!-- TP 3: Operational Volume Selection Dial -->
                                <div class="vst-item" id="scr-tp-3"></div>
                                <!-- TP 4: Squelch Threshold Selection Dial -->
                                <div class="vst-item" id="scr-tp-4"></div>
                            </div>
                        </div>
                    </div>

                    <!-- ======================================================= -->
                    <!-- SECTION 2: VIBRATOR PLATE SUPPLY & VEHICULAR MOUNT -->
                    <!-- ======================================================= -->
                    <div class="radio-rack-column olive-well" id="scr610-power-supply">
                        <h2>PE-117 VIBRATOR PLATE SUPPLY & MOUNTING</h2>
                        
                        <div class="vst-zone military-border">
                            <h3>VIBRATOR CIRCUITS & FILAMENT ENERGIZE</h3>
                            <div class="vst-grid">
                                <!-- TP 5: Main Battery Master Lead Input Switch -->
                                <div class="vst-item" id="scr-tp-5"></div>
                                <!-- TP 6: Vibrator Core Selector Switch -->
                                <div class="vst-item" id="scr-tp-6"></div>
                                <!-- TP 7: Panel Lamp Test Switch -->
                                <div class="vst-item" id="scr-tp-7"></div>
                            </div>
                        </div>

                        <div class="vst-zone military-border">
                            <h3>VEHICULAR / MAST ANTENNA MATCHING MODULE</h3>
                            <div class="vst-grid">
                                <!-- TP 8: Telescoping vs Vehicular Antenna Route Selector Switch -->
                                <div class="vst-item" id="scr-tp-8"></div>
                                <!-- TP 9: Telemetry Modulator Sync Mode Toggle -->
                                <div class="vst-item" id="scr-tp-9"></div>
                            </div>
                        </div>
                        
                        <!-- Built-in Morse Dispatch Trigger slot integration link -->
                        <div id="scr610-telegraph-key-slot" style="margin-top: auto;"></div>
                    </div>
                </div>
            </div>
        `;

        this.mountIndicatingMeter();
        this.bindScr610TouchTargets();
    }

    mountIndicatingMeter() {
        // Models the face of the analog tuning galvanometer gauge seen on the radio housing front panel
        this.indicatingMeter = new AnalogMeter('vst-meter-scr610-indicator', 'Signal/Battery Level', 'DC VOLTS / RF', 0, 10);
    }

    bindScr610TouchTargets() {
        // --- BC-659 OPERATIONAL TARGETS ---
        // TP 1: Discrete Channel A / Channel B Selector (No free cranking!)
        this.controls['SCR610_CHAN_SEL'] = new VstKnob('scr-tp-1', 'CHANNEL PRESET', 2, ['CHANNEL_A (27.0M)', 'CHANNEL_B (38.9M)'], (channel) => {
            this.sendScrCommand('SCR610_CHANNEL', channel);
            if (this.indicatingMeter) this.indicatingMeter.spikeToValue(6.8, 400); // Deflect needle onto channel lock parameters
        });

        // TP 2: Dial Tuning Mechanical Clamp Lock
        this.controls['SCR610_LOCK'] = new VstSwitch('scr-tp-2', 'DIAL CLAMP LOCK', 'UNLOCKED', 'SECURED', (state) => {
            this.sendScrCommand('SCR610_CLAMP', state);
        });

        // TP 3: Stepped Volume Level Matrix Switch
        this.controls['SCR610_VOLUME'] = new VstKnob('scr-tp-3', 'RECEIVER VOLUME', 5, ['OFF', 'STEP_1', 'STEP_2', 'STEP_3', 'MAX_GAIN'], (vol) => {
            this.sendScrCommand('SCR610_VOL_LEVEL', vol);
        });

        // TP 4: Stepped Squelch Control
        this.controls['SCR610_SQUELCH'] = new VstKnob('scr-tp-4', 'SQUELCH LIMIT', 4, ['BYPASS', 'SIGNAL_LOW', 'SIGNAL_MED', 'SIGNAL_TIGHT'], (sq) => {
            this.sendScrCommand('SCR610_SQUELCH_LEVEL', sq);
        });


        // --- PE-117 POWER SUPPLY & MOUNTING TARGETS ---
        // TP 5: Battery Leads Master Circuit Input Selector
        this.controls['SCR610_BATTERY_FEED'] = new VstSwitch('scr-tp-5', 'BATTERY LEADS', 'DISCONNECTED', 'CONNECTED', (state) => {
            this.sendScrCommand('SCR610_POWER_INPUT', state);
            if (this.indicatingMeter && state === 1) {
                this.indicatingMeter.spikeToValue(5.2, 800); // Needle rises steady to show battery health voltage
            }
        });

        // TP 6: Backup Vibrator Switch Selector (Swaps physical vib elements on fault cascades)
        this.controls['SCR610_VIBRATOR'] = new VstSwitch('scr-tp-6', 'VIBRATOR UNIT', 'PRIMARY_V1', 'RESERVE_V2', (state) => {
            this.sendScrCommand('SCR610_VIB_CORE', state);
        });

        // TP 7: Panel Protective Shutter/Lamp illumination Switch
        this.controls['SCR610_LAMP'] = new VstSwitch('scr-tp-7', 'DIAL ILLUMINATE', 'DIM', 'BRIGHT', (state) => {
            this.sendScrCommand('SCR610_LAMP_BRIGHTNESS', state);
        });

        // TP 8: Structural Antenna Route Selector Switch (Vehicular vs Telescoping)
        this.controls['SCR610_ANTENNA'] = new VstSwitch('scr-tp-8', 'ANTENNA SELECT', 'TELESCOPING', 'VEHICULAR MAST', (state) => {
            this.sendScrCommand('SCR610_ANT_ROUTE', state);
        });

        // TP 9: Mainframe Sync Interleave Mode Switch
        this.controls['SCR610_SYNC_MODE'] = new VstSwitch('scr-tp-9', 'BRIDGE SYNC MOD', 'RAW AUDIO', 'FIELDATA PACK', (state) => {
            this.sendScrCommand('SCR610_BRIDGE_MODULATION', state);
        });
    }

    sendScrCommand(parameterKey, currentVal) {
        console.log(`📻 SCR-610 Radio Command -> [${parameterKey}] changed to: ${currentVal}`);
        
        // Log transactions directly onto your WinForms data logging console track views
        window.dispatchEvent(new CustomEvent('radio-telemetry-log', {
            detail: { param: parameterKey, value: currentVal }
        }));

        if (this.bridge && typeof this.bridge.writeHardwareAddress === 'function') {
            this.bridge.writeHardwareAddress(parameterKey, currentVal);
        }
    }
}
