import React, { useState, useEffect, useRef } from 'react';
import { TvDevice } from '../types.ts';
import { VirtualStick } from './VirtualStick.tsx';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { physicalGamepad, GamepadSnapshot } from '../services/gamepadService.ts';
import { 
  Tv, 
  Gamepad2, 
  Maximize2, 
  Minimize2,
  Radio,
  Zap
} from 'lucide-react';

interface GamepadControllerProps {
  device: TvDevice | null;
  onSendCommand: (cmd: string, type?: 'press' | 'down' | 'up') => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenPairing: () => void;
}

export const GamepadController: React.FC<GamepadControllerProps> = ({
  device,
  onSendCommand,
  isFullscreen,
  onToggleFullscreen,
  onOpenPairing,
}) => {
  const [activeButtons, setActiveButtons] = useState<Record<string, boolean>>({});
  const [lastDispatched, setLastDispatched] = useState<string>('');
  const stickDeadzone = 0.2;

  const leftStickLastDirRef = useRef<string>('');
  const rightStickLastDirRef = useRef<string>('');

  // Handle pointer down (independent multi-touch tracking)
  const handlePointerDown = (cmd: string, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setLastDispatched(cmd);
    setActiveButtons(prev => ({ ...prev, [cmd]: true }));
    haptics.lightTap();
    soundFX.playClick(cmd.startsWith('Button') ? 650 : 500);
    onSendCommand(cmd, 'down');
  };

  const handlePointerUp = (cmd: string, e: React.PointerEvent) => {
    e.preventDefault();
    setActiveButtons(prev => ({ ...prev, [cmd]: false }));
    onSendCommand(cmd, 'up');
  };

  const sendTap = (cmd: string) => {
    setLastDispatched(cmd);
    setActiveButtons(prev => ({ ...prev, [cmd]: true }));
    haptics.lightTap();
    soundFX.playClick(550);
    setTimeout(() => {
      setActiveButtons(prev => ({ ...prev, [cmd]: false }));
    }, 120);
    onSendCommand(cmd, 'press');
  };

  // Listen to physical gamepad if plugged in
  useEffect(() => {
    const unsub = physicalGamepad.subscribe((snapshot: GamepadSnapshot, activeCommands: string[]) => {
      activeCommands.forEach(cmd => {
        sendTap(cmd);
      });
    });
    return () => unsub();
  }, []);

  // Left stick
  const handleLeftStick = (pos: { x: number; y: number; distance: number; angle: number }) => {
    if (pos.distance < stickDeadzone) {
      leftStickLastDirRef.current = '';
      return;
    }

    let dir = '';
    if (pos.y < -0.45 && Math.abs(pos.x) < 0.6) dir = 'Up';
    else if (pos.y > 0.45 && Math.abs(pos.x) < 0.6) dir = 'Down';
    else if (pos.x < -0.45 && Math.abs(pos.y) < 0.6) dir = 'Left';
    else if (pos.x > 0.45 && Math.abs(pos.y) < 0.6) dir = 'Right';

    if (dir && dir !== leftStickLastDirRef.current) {
      leftStickLastDirRef.current = dir;
      sendTap(dir);
    }
  };

  // Right stick
  const handleRightStick = (pos: { x: number; y: number; distance: number; angle: number }) => {
    if (pos.distance < stickDeadzone) {
      rightStickLastDirRef.current = '';
      return;
    }

    let dir = '';
    if (pos.y < -0.6) dir = 'VolumeUp';
    else if (pos.y > 0.6) dir = 'VolumeDown';
    else if (pos.x < -0.6) dir = 'Rev';
    else if (pos.x > 0.6) dir = 'Fwd';

    if (dir && dir !== rightStickLastDirRef.current) {
      rightStickLastDirRef.current = dir;
      sendTap(dir);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-2 select-none">
      
      {/* Top Bar: TV Status & Clean Actions */}
      <div className="flex items-center justify-between p-3 mb-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-neutral-300" />
          <span className="font-semibold text-neutral-200">Mando de Consola</span>
          <span className="text-neutral-500 font-mono">| {device?.name?.split(' ')[0] || 'TCL TV'}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sincronizar Inicio + OK */}
          <button
            onClick={onOpenPairing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-medium transition-colors border border-neutral-700"
          >
            <Radio className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sincronizar (1m)</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Minimalist Controller Body */}
      <div className="w-full bg-neutral-900/95 rounded-3xl p-5 sm:p-7 border border-neutral-800 shadow-xl">
        
        {/* 1. Shoulder Buttons (L1, L2, R1, R2) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-12 mb-6">
          {/* Left Shoulder */}
          <div className="flex gap-2">
            <button
              onPointerDown={(e) => handlePointerDown('L2', e)}
              onPointerUp={(e) => handlePointerUp('L2', e)}
              onPointerCancel={(e) => handlePointerUp('L2', e)}
              className={`flex-1 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                activeButtons['L2']
                  ? 'bg-neutral-700 border-neutral-400 text-white scale-95'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="font-bold text-sm font-mono">L2</span>
              <span className="text-[10px] text-neutral-500">Gatillo</span>
            </button>

            <button
              onPointerDown={(e) => handlePointerDown('L1', e)}
              onPointerUp={(e) => handlePointerUp('L1', e)}
              onPointerCancel={(e) => handlePointerUp('L1', e)}
              className={`flex-1 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                activeButtons['L1']
                  ? 'bg-neutral-700 border-neutral-400 text-white scale-95'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="font-bold text-sm font-mono">L1</span>
              <span className="text-[10px] text-neutral-500">Bumper</span>
            </button>
          </div>

          {/* Right Shoulder */}
          <div className="flex gap-2">
            <button
              onPointerDown={(e) => handlePointerDown('R1', e)}
              onPointerUp={(e) => handlePointerUp('R1', e)}
              onPointerCancel={(e) => handlePointerUp('R1', e)}
              className={`flex-1 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                activeButtons['R1']
                  ? 'bg-neutral-700 border-neutral-400 text-white scale-95'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="font-bold text-sm font-mono">R1</span>
              <span className="text-[10px] text-neutral-500">Bumper</span>
            </button>

            <button
              onPointerDown={(e) => handlePointerDown('R2', e)}
              onPointerUp={(e) => handlePointerUp('R2', e)}
              onPointerCancel={(e) => handlePointerUp('R2', e)}
              className={`flex-1 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                activeButtons['R2']
                  ? 'bg-neutral-700 border-neutral-400 text-white scale-95'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="font-bold text-sm font-mono">R2</span>
              <span className="text-[10px] text-neutral-500">Gatillo</span>
            </button>
          </div>
        </div>

        {/* 2. Main Wings (D-Pad, Center, ABXY) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Left Wing: D-Pad & Left Stick */}
          <div className="flex flex-col items-center gap-6">
            {/* Minimalist D-Pad */}
            <div className="relative w-36 h-36 flex items-center justify-center bg-neutral-950 rounded-full border border-neutral-800">
              <div className="absolute w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 pointer-events-none" />

              {/* UP */}
              <button
                onPointerDown={(e) => handlePointerDown('Up', e)}
                onPointerUp={(e) => handlePointerUp('Up', e)}
                onPointerCancel={(e) => handlePointerUp('Up', e)}
                className={`absolute top-1 w-10 h-11 rounded-t-xl border flex items-center justify-center transition-all ${
                  activeButtons['Up'] ? 'bg-neutral-600 border-neutral-300 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                }`}
              >
                ▲
              </button>

              {/* DOWN */}
              <button
                onPointerDown={(e) => handlePointerDown('Down', e)}
                onPointerUp={(e) => handlePointerUp('Down', e)}
                onPointerCancel={(e) => handlePointerUp('Down', e)}
                className={`absolute bottom-1 w-10 h-11 rounded-b-xl border flex items-center justify-center transition-all ${
                  activeButtons['Down'] ? 'bg-neutral-600 border-neutral-300 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                }`}
              >
                ▼
              </button>

              {/* LEFT */}
              <button
                onPointerDown={(e) => handlePointerDown('Left', e)}
                onPointerUp={(e) => handlePointerUp('Left', e)}
                onPointerCancel={(e) => handlePointerUp('Left', e)}
                className={`absolute left-1 w-11 h-10 rounded-l-xl border flex items-center justify-center transition-all ${
                  activeButtons['Left'] ? 'bg-neutral-600 border-neutral-300 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                }`}
              >
                ◀
              </button>

              {/* RIGHT */}
              <button
                onPointerDown={(e) => handlePointerDown('Right', e)}
                onPointerUp={(e) => handlePointerUp('Right', e)}
                onPointerCancel={(e) => handlePointerUp('Right', e)}
                className={`absolute right-1 w-11 h-10 rounded-r-xl border flex items-center justify-center transition-all ${
                  activeButtons['Right'] ? 'bg-neutral-600 border-neutral-300 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                }`}
              >
                ▶
              </button>
            </div>

            <VirtualStick
              label="Stick Izquierdo"
              size={130}
              onMove={handleLeftStick}
              onClick={() => sendTap('L3')}
            />
          </div>

          {/* Center Panel: Select, Home (Inicio), Start */}
          <div className="flex flex-col items-center justify-between gap-4 py-2 px-2 bg-neutral-950/60 rounded-2xl border border-neutral-800/80 h-full">
            <div className="flex items-center justify-between w-full px-2 gap-2">
              <button
                onPointerDown={(e) => handlePointerDown('Back', e)}
                onPointerUp={(e) => handlePointerUp('Back', e)}
                onPointerCancel={(e) => handlePointerUp('Back', e)}
                className={`px-3 py-2 rounded-xl border flex flex-col items-center justify-center flex-1 transition-all ${
                  activeButtons['Back']
                    ? 'bg-neutral-700 border-neutral-300 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-mono font-bold">SELECT</span>
                <span className="text-[9px] text-neutral-500">Atrás</span>
              </button>

              {/* INICIO (HOME) - Supports simultaneous hold with OK */}
              <button
                onPointerDown={(e) => handlePointerDown('Home', e)}
                onPointerUp={(e) => handlePointerUp('Home', e)}
                onPointerCancel={(e) => handlePointerUp('Home', e)}
                className={`w-14 h-14 rounded-full border flex flex-col items-center justify-center transition-all ${
                  activeButtons['Home']
                    ? 'bg-neutral-200 text-neutral-950 border-white shadow-lg'
                    : 'bg-neutral-900 text-neutral-200 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                <span className="text-[9px] font-bold text-neutral-400">TCL</span>
                <Tv className="w-4 h-4" />
              </button>

              <button
                onPointerDown={(e) => handlePointerDown('Select', e)}
                onPointerUp={(e) => handlePointerUp('Select', e)}
                onPointerCancel={(e) => handlePointerUp('Select', e)}
                className={`px-3 py-2 rounded-xl border flex flex-col items-center justify-center flex-1 transition-all ${
                  activeButtons['Select']
                    ? 'bg-neutral-700 border-neutral-300 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-mono font-bold">START</span>
                <span className="text-[9px] text-neutral-500">Menú</span>
              </button>
            </div>

            {/* Touchpad bar */}
            <div
              onClick={() => sendTap('Select')}
              className="w-full h-16 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center cursor-pointer hover:border-neutral-700 transition-colors"
            >
              <span className="text-xs font-medium text-neutral-400">TOUCHPAD / CLICK OK</span>
            </div>

            {/* Volume bar */}
            <div className="flex items-center justify-between w-full px-2 py-1.5 bg-neutral-900 rounded-xl border border-neutral-800 text-xs">
              <button
                onClick={() => sendTap('VolumeDown')}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-bold"
              >
                VOL -
              </button>
              <span className="font-mono text-neutral-300 font-bold">{device?.volume ?? 20}%</span>
              <button
                onClick={() => sendTap('VolumeUp')}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-bold"
              >
                VOL +
              </button>
            </div>
          </div>

          {/* Right Wing: ABXY & Right Stick */}
          <div className="flex flex-col items-center gap-6">
            {/* Minimalist ABXY Diamond */}
            <div className="relative w-36 h-36 flex items-center justify-center bg-neutral-950 rounded-full border border-neutral-800">
              {/* Y (North) */}
              <button
                onPointerDown={(e) => handlePointerDown('ButtonY', e)}
                onPointerUp={(e) => handlePointerUp('ButtonY', e)}
                onPointerCancel={(e) => handlePointerUp('ButtonY', e)}
                className={`absolute top-1 w-11 h-11 rounded-full border flex items-center justify-center font-bold text-sm transition-all ${
                  activeButtons['ButtonY'] ? 'bg-neutral-600 border-white text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                }`}
              >
                Y
              </button>

              {/* A (South) */}
              <button
                onPointerDown={(e) => handlePointerDown('ButtonA', e)}
                onPointerUp={(e) => handlePointerUp('ButtonA', e)}
                onPointerCancel={(e) => handlePointerUp('ButtonA', e)}
                className={`absolute bottom-1 w-11 h-11 rounded-full border flex items-center justify-center font-bold text-sm transition-all ${
                  activeButtons['ButtonA'] ? 'bg-neutral-600 border-white text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                }`}
              >
                A
              </button>

              {/* X (West) */}
              <button
                onPointerDown={(e) => handlePointerDown('ButtonX', e)}
                onPointerUp={(e) => handlePointerUp('ButtonX', e)}
                onPointerCancel={(e) => handlePointerUp('ButtonX', e)}
                className={`absolute left-1 w-11 h-11 rounded-full border flex items-center justify-center font-bold text-sm transition-all ${
                  activeButtons['ButtonX'] ? 'bg-neutral-600 border-white text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                }`}
              >
                X
              </button>

              {/* B (East) */}
              <button
                onPointerDown={(e) => handlePointerDown('ButtonB', e)}
                onPointerUp={(e) => handlePointerUp('ButtonB', e)}
                onPointerCancel={(e) => handlePointerUp('ButtonB', e)}
                className={`absolute right-1 w-11 h-11 rounded-full border flex items-center justify-center font-bold text-sm transition-all ${
                  activeButtons['ButtonB'] ? 'bg-neutral-600 border-white text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                }`}
              >
                B
              </button>
            </div>

            <VirtualStick
              label="Stick Derecho"
              size={130}
              onMove={handleRightStick}
              onClick={() => sendTap('R3')}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
