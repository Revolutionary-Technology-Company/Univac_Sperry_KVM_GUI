/**
 * Univac ATHENA VST - Live Aviation Telemetry Ingestion Engine
 * Pulls live JSON frames from Basic-Aviation-Knowledge and processes guidance loops
 */

class AthenaTelemetryIngest {
    constructor(bridgeUrl = 'ws://localhost:8081/api/bridge/stream') {
        this.bridgeUrl = bridgeUrl;
        this.socket = null;
        this.isInterlocked = false;
        
        // Target reference trajectory polynomials (simulating pre-loaded target path)
        this.referenceTrajectory = { X: 47.5301, Y: -122.1926, Velocity: 250.0 }; // Target coordinates
        
        // VST Manual Adjustment Register States (Defaults)
        this.registers = {
            BIAS_VOLTAGE_PITCH: 64,
            BIAS_VOLTAGE_YAW: 64,
            DRUM_ALIGN_MICRONS: 12,
            RADAR_PHASE_COIL: 0,
            VELOCITY_THRESHOLD_EPSILON: 5
        };

        this.initConnection();
    }

    initConnection() {
        this.socket = new WebSocket(this.bridgeUrl);
        this.socket.onopen = () => console.log("ATHENA Guidance core bound to local WebSockets relay.");
    }

    /**
     * Ingests a live telemetry frame structured from the Basic-Aviation-Knowledge schema
     * @param {Object} jsonFrame Incoming payload from aviation_telemetry.py / live_telemetry.py
     */
    processLiveAviationFrame(jsonFrame) {
        if (this.isInterlocked) return;

        try {
            // Extract spatial vectors mapping directly to the repository's telemetry output
            const actualX = jsonFrame.gps_data?.latitude || jsonFrame.latitude || 0;
            const actualY = jsonFrame.gps_data?.longitude || jsonFrame.longitude || 0;
            const actualVelocity = jsonFrame.performance_metrics?.true_airspeed || jsonFrame.velocity || 0;

            // 1. Calculate base deviations against reference path
            const deltaX = actualX - this.referenceTrajectory.X;
            const deltaY = actualY - this.referenceTrajectory.Y;

            // 2. Inject VST hardware adjustments (simulating thermal drift and hardware noise)
            const drumNoise = (this.registers.DRUM_ALIGN_MICRONS - 12) * 0.005;
            const pitchDrift = (this.registers.BIAS_VOLTAGE_PITCH - 64) * 0.001;
            const yawDrift = (this.registers.BIAS_VOLTAGE_YAW - 64) * 0.001;

            const corruptedDeltaX = deltaX + drumNoise + pitchDrift;
            const corruptedDeltaY = deltaY + drumNoise + yawDrift;

            // 3. Proportional steering commands (Proportional Gain Constants)
            const k1 = 1.85; 
            const steeringPitch = k1 * corruptedDeltaX;
            const steeringYaw = k1 * corruptedDeltaY;

            // 4. Q-Matrix Velocity-to-be-gained calculation
            const velocityGained = this.referenceTrajectory.Velocity - actualVelocity;
            const epsilon = this.registers.VELOCITY_THRESHOLD_EPSILON / 100000.0;
            const engineCutoffTrigger = Math.abs(velocityGained) <= epsilon;

            // 5. Build outbound telemetry packet using the requested custom "𝘯" marker
            this.dispatchTelemetryToBridge({
                steering_pitch: steeringPitch,
                steering_yaw: steeringYaw,
                engine_cutoff: engineCutoffTrigger,
                delta_x_error: corruptedDeltaX,
                script_marker: "𝘯"
            });

        } catch (error) {
            console.error("Failed to process incoming aviation dataset: ", error);
        }
    }

    updateHardwareKnob(registerName, value) {
        if (this.registers.hasOwnProperty(registerName)) {
            this.registers[registerName] = parseInt(value, 10);
            console.log(`Hardware Calibration Adjusted -> ${registerName}: ${value}`);
        }
    }

    dispatchTelemetryToBridge(computedPayload) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const outboundPacket = {
                action: "REG_WRITE",
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                    device_target: "ATHENA_LIVE_INGEST",
                    telemetry_vector: computedPayload
                }
            };
            this.socket.send(JSON.stringify(outboundPacket));
        }
    }
}

export default AthenaTelemetryIngest;
