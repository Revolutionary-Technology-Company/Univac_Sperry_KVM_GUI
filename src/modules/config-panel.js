export class SperryConfigGuiPanel {
    constructor(containerId, bridgeClient) {
        this.container = document.getElementById(containerId);
        this.bridge = bridgeClient;
    }

    init() {
        this.container.innerHTML = `
            <div class="sperry-software-window">
                <!-- Windows System Title Bar Frame -->
                <div class="winforms-titlebar">
                    <div class="titlebar-left">
                        <!-- HOOK 1: TITLEBAR ICON -->
                        <div class="sperry-app-icon-slot"></div>
                        <span>Sperry Software Add-In Configuration</span>
                    </div>
                </div>

                <!-- Core Work Canvas Application Window Interface Content -->
                <div class="winforms-canvas">
                    
                    <!-- Gradient Corporate Banner Top Header Asset -->
                    <div class="sperry-brand-banner">
                        <!-- HOOK 2: LEFT BANNER EMBEDDED GOLD SPERRY BADGE -->
                        <div class="banner-left-logo-slot"></div>
                        
                        <span class="banner-title-text">Professional Outlook<sup>®</sup> Add-Ins</span>
                        
                        <!-- HOOK 3: RIGHT BANNER RETRO BUSINESS CLIP ART/IMAGE -->
                        <div class="banner-right-photo-slot"></div>
                    </div>

                    <!-- Split Panel Content Grid Workspace Wrapper Layout -->
                    <div style="display: flex; padding: 6px; gap: 8px; height: calc(100% - 94px); box-sizing: border-box;">
                        
                        <!-- LEFT HAND WORKSPACE: INSTALLED ADD-INS BLOCK PANEL -->
                        <div style="width: 172px; display: flex; flex-direction: column;">
                            <div class="winforms-groupbox" style="height: 100%; margin-top: 4px; padding-top: 12px;">
                                <span class="winforms-groupbox-legend">Installed Add-Ins</span>
                                
                                <div class="addins-table-frame">
                                    <div class="addins-table-header">
                                        <div class="table-header-cell" style="width: 38px; text-align: center;">On/Off</div>
                                        <div class="table-header-cell" style="width: 32px; text-align: center;">Icon</div>
                                        <div class="table-header-cell" style="flex-grow: 1; border-right: none;">Name</div>
                                    </div>
                                    <div class="addins-table-row">
                                        <div style="width: 38px; text-align: center;">
                                            <input type="checkbox" checked style="margin: 0; vertical-align: middle;">
                                        </div>
                                        
                                        <!-- HOOK 4: GRID CELL SPECIFIC NOTIFICATION ICON -->
                                        <div class="table-cell-icon-slot"></div>
                                        
                                        <div style="flex-grow: 1; padding-left: 4px;">Email Reminders</div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <!-- RIGHT HAND WORKSPACE: ACTIVE CONSOLE MACHINE SELECTION AND BRIDGE PROPERTIES PARAMETERS -->
                        <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                            <div class="winforms-groupbox" style="margin-top: 4px; padding-top: 14px;">
                                <span class="winforms-groupbox-legend">Add-In Configuration</span>
                                
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <label style="font-size: 11px;">Email Address where reminders are to be sent</label>
                                    <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
                                        <input type="text" class="winforms-input-text" value="john.smith@domain.com" style="flex-grow: 1;">
                                        <button class="winforms-btn" style="min-width: 96px;">Choose Address...</button>
                                    </div>
                                </div>
                            </div>

                            <div class="winforms-groupbox" style="margin-top: 4px; padding-top: 14px; flex-grow: 1;">
                                <span class="winforms-groupbox-legend">Options</span>
                                
                                <div style="display: flex; flex-direction: column; gap: 6px; padding-left: 2px;">
                                    <label style="display: flex; align-items: center; gap: 4px;">
                                        <input type="checkbox" checked>
                                        <span>Send email reminders for all flagged item popup alarms</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 4px;">
                                        <input type="checkbox">
                                        <span>Send all email reminders with high priority</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 4px;">
                                        <input type="checkbox">
                                        <span>Limit the number of characters sent to 
                                            <input type="text" class="winforms-input-text" value="99999" style="width: 42px; height: 18px; text-align: center; display: inline-block;"> 
                                            characters
                                        </span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 4px;">
                                        <input type="checkbox">
                                        <span>Delete the email after sending</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Bottom Status Tray Spacer Block Pane -->
                    <div style="height: 26px; border: 1px solid #A0A0A0; margin: 0 6px; background-color: #E9EEF4;"></div>

                    <!-- Lower Utility Action Operations Commands Row Tray -->
                    <div style="position: absolute; bottom: 6px; left: 6px; right: 6px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 4px;">
                            <button class="winforms-btn">About...</button>
                            <button class="winforms-btn">Options...</button>
                        </div>
                        <button class="winforms-btn" style="margin-left: auto; margin-right: 24px;">Help...</button>
                        <div style="display: flex; gap: 4px;">
                            <button class="winforms-btn" id="gui-btn-ok">OK</button>
                            <button class="winforms-btn">Cancel</button>
                            <button class="winforms-btn" style="color: #808080;" disabled>Apply</button>
                        </div>
                    </div>

                </div>
            </div>
        `;

        this.bindUserInteractions();
    }

    bindUserInteractions() {
        // Form transmission mappings stay bounded securely here
    }
}
