import { SperryTuiScreen } from '../components/tui-screen.js';

const tuiEngine = new SperryTuiScreen('tui-matrix-container', null);

// Build an interactive test profile form layout map:
tuiEngine.defineField(2, 5, "SPERRY UNIVAC 1100/80 MAIN CONSOLE NODE ROUTER");
tuiEngine.defineField(5, 5, "TARGET BRIDGE NODE: ");
tuiEngine.defineField(5, 25, "        ", "input"); // Space reserved for typing 
tuiEngine.defineField(7, 5, "CHASSIS COMMAND:    ");
tuiEngine.defineField(7, 25, "                ", "input"); // Space reserved for typing 

tuiEngine.render();
