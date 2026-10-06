export type ControllerStyle = 'playstation' | 'xbox' | 'switch' | 'arcade';

export type ControllerMode = 'gamepad' | 'remote' | 'trackpad' | 'apps' | 'macro' | 'ai_assistant' | 'guide';

export interface TvDevice {
  id: string;
  name: string;
  model: string;
  ip: string;
  port: number;
  protocol: 'roku' | 'android_tv' | 'tcl_tcast' | 'virtual';
  online: boolean;
  powerState: 'on' | 'standby';
  volume: number;
  muted: boolean;
  currentApp: string;
  inputSource: string;
  gameMode: boolean;
  vrrEnabled: boolean;
  refreshRate: string;
  latencyMs: number;
  lastSeen: number;
  paired?: boolean;
  voiceSensitivity?: 'normal' | 'high' | 'ultra';
  pairingProgress?: number;
}

export interface JoystickPosition {
  x: number; // -1 to 1
  y: number; // -1 to 1
  angle: number; // degrees 0-360
  distance: number; // 0 to 1
  active: boolean;
}

export interface GamepadButtonState {
  pressed: boolean;
  value: number; // 0 to 1 for analog triggers
}

export interface MacroAction {
  command: string;
  delayMs: number;
  type?: 'press' | 'down' | 'up';
}

export interface MacroProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'shortcut' | 'gaming' | 'navigation';
  actions: MacroAction[];
}

export interface PhysicalGamepadInfo {
  id: string;
  index: number;
  connected: boolean;
  buttons: number[];
  axes: number[];
}
