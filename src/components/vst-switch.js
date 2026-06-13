export class VstSwitch {
    constructor(targetId, label, textOff, textOn, changeCallback) {
        this.wrapper = document.getElementById(targetId);
        this.label = label;
        this.textOff = textOff;
        this.textOn = textOn;
        this.callback = changeCallback;
        this.state = 0; // 0 = Off / Up position, 1 = On / Down position

        this.render();
    }

    render() {
        this.wrapper.innerHTML = `
            <div class="vst-switch-container">
                <span class="vst-ctrl-label">${this.label}</span>
                <div class="vst-switch-hitbox">
                    <span class="vst-switch-text text-top">${this.textOff}</span>
                    <div class="vst-switch-track">
                        <div class="vst-switch-toggle-handle"></div>
                    </div>
                    <span class="vst-switch-text text-bottom">${this.textOn}</span>
                </div>
            </div>
        `;

        // Touch event handlers bypassing mobile tap delays
        const targetHitbox = this.wrapper.querySelector('.vst-switch-hitbox');
        targetHitbox.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleState();
        }, { passive: false });
    }

    toggleState() {
        this.state = this.state === 0 ? 1 : 0;
        const track = this.wrapper.querySelector('.vst-switch-track');
        
        if (this.state === 1) {
            track.classList.add('active-down');
        } else {
            track.classList.remove('active-down');
        }

        if (this.callback) this.callback(this.state);
    }
}
