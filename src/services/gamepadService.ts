// Physical Gamepad API reader and event dispatcher
export interface GamepadSnapshot {
  connected: boolean;
  id: string;
  buttons: boolean[];
  axes: number[];
}

type GamepadCallback = (snapshot: GamepadSnapshot, activeCommands: string[]) => void;

class GamepadListener {
  private listeners: Set<GamepadCallback> = new Set();
  private rafId: number | null = null;
  private prevButtonStates: boolean[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', (e: any) => {
        console.log('Mando físico detectado:', e.gamepad.id);
        this.startPolling();
      });
      window.addEventListener('gamepaddisconnected', () => {
        this.startPolling();
      });
    }
  }

  public subscribe(cb: GamepadCallback) {
    this.listeners.add(cb);
    this.startPolling();
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0 && this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    };
  }

  private startPolling() {
    if (this.rafId) return;

    const poll = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads ? Array.from(gamepads).find(g => g !== null) : null;

        if (gp) {
          const buttonStates = gp.buttons.map(b => b.pressed || b.value > 0.4);
          const axes = Array.from(gp.axes);
          const activeCommands: string[] = [];

          // Mapping standard gamepad layout:
          // 0: A/Cross, 1: B/Circle, 2: X/Square, 3: Y/Triangle
          // 4: L1, 5: R1, 6: L2, 7: R2, 8: Select/Back, 9: Start, 10: L3, 11: R3
          // 12: DpadUp, 13: DpadDown, 14: DpadLeft, 15: DpadRight, 16: Guide/Home
          if (buttonStates[0] && !this.prevButtonStates[0]) activeCommands.push('ButtonA');
          if (buttonStates[1] && !this.prevButtonStates[1]) activeCommands.push('ButtonB');
          if (buttonStates[2] && !this.prevButtonStates[2]) activeCommands.push('ButtonX');
          if (buttonStates[3] && !this.prevButtonStates[3]) activeCommands.push('ButtonY');
          if (buttonStates[4] && !this.prevButtonStates[4]) activeCommands.push('L1');
          if (buttonStates[5] && !this.prevButtonStates[5]) activeCommands.push('R1');
          if (buttonStates[6] && !this.prevButtonStates[6]) activeCommands.push('L2');
          if (buttonStates[7] && !this.prevButtonStates[7]) activeCommands.push('R2');
          if (buttonStates[8] && !this.prevButtonStates[8]) activeCommands.push('Back');
          if (buttonStates[9] && !this.prevButtonStates[9]) activeCommands.push('Select');
          if (buttonStates[10] && !this.prevButtonStates[10]) activeCommands.push('L3');
          if (buttonStates[11] && !this.prevButtonStates[11]) activeCommands.push('R3');
          if (buttonStates[12] && !this.prevButtonStates[12]) activeCommands.push('Up');
          if (buttonStates[13] && !this.prevButtonStates[13]) activeCommands.push('Down');
          if (buttonStates[14] && !this.prevButtonStates[14]) activeCommands.push('Left');
          if (buttonStates[15] && !this.prevButtonStates[15]) activeCommands.push('Right');
          if (buttonStates[16] && !this.prevButtonStates[16]) activeCommands.push('Home');

          // Left stick D-pad thresholds
          if (axes[1] < -0.55 && (this.prevButtonStates[100] !== true)) {
            activeCommands.push('Up');
          }
          if (axes[1] > 0.55 && (this.prevButtonStates[101] !== true)) {
            activeCommands.push('Down');
          }
          if (axes[0] < -0.55 && (this.prevButtonStates[102] !== true)) {
            activeCommands.push('Left');
          }
          if (axes[0] > 0.55 && (this.prevButtonStates[103] !== true)) {
            activeCommands.push('Right');
          }

          this.prevButtonStates = [...buttonStates];
          this.prevButtonStates[100] = axes[1] < -0.55;
          this.prevButtonStates[101] = axes[1] > 0.55;
          this.prevButtonStates[102] = axes[0] < -0.55;
          this.prevButtonStates[103] = axes[0] > 0.55;

          const snapshot: GamepadSnapshot = {
            connected: true,
            id: gp.id,
            buttons: buttonStates,
            axes,
          };

          this.listeners.forEach(cb => cb(snapshot, activeCommands));
        }
      }

      this.rafId = requestAnimationFrame(poll);
    };

    this.rafId = requestAnimationFrame(poll);
  }
}

export const physicalGamepad = new GamepadListener();
