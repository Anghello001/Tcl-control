import React, { useState, useEffect, useRef } from 'react';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { MousePointer, Compass, Sparkles, Move, RefreshCw } from 'lucide-react';

interface AirMouseTrackpadProps {
  device: TvDevice | null;
  onSendCommand: (cmd: string, type?: 'press' | 'down' | 'up') => void;
}

export const AirMouseTrackpad: React.FC<AirMouseTrackpadProps> = ({
  device,
  onSendCommand,
}) => {
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [gyroSupported, setGyroSupported] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [touchActive, setTouchActive] = useState(false);
  const trackpadRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Handle device orientation for Air Mouse mode
  useEffect(() => {
    if (!gyroEnabled) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      // Gamma is left-to-right (-90 to 90), Beta is front-to-back (-180 to 180)
      const normX = Math.min(100, Math.max(0, 50 + (e.gamma / 30) * 50));
      const normY = Math.min(100, Math.max(0, 50 + ((e.beta - 40) / 30) * 50));

      setCursorPos({ x: normX, y: normY });
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      setGyroSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [gyroEnabled]);

  const requestGyroPermission = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setGyroEnabled(true);
          haptics.mediumImpact();
          soundFX.playSuccess();
        }
      } catch (err) {
        console.error('Gyro error:', err);
      }
    } else {
      setGyroEnabled(!gyroEnabled);
      haptics.mediumImpact();
      soundFX.playClick();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setTouchActive(true);
    lastTouchRef.current = { x: e.clientX, y: e.clientY };
    haptics.lightTap();
    soundFX.playClick(600, 0.02);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!touchActive || !lastTouchRef.current) return;
    const dx = e.clientX - lastTouchRef.current.x;
    const dy = e.clientY - lastTouchRef.current.y;

    lastTouchRef.current = { x: e.clientX, y: e.clientY };

    setCursorPos(prev => ({
      x: Math.min(100, Math.max(0, prev.x + dx * 0.4)),
      y: Math.min(100, Math.max(0, prev.y + dy * 0.4)),
    }));

    // Send directional key if rapid swipe
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
      onSendCommand(dx > 0 ? 'Right' : 'Left');
      haptics.lightTap();
    } else if (Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx)) {
      onSendCommand(dy > 0 ? 'Down' : 'Up');
      haptics.lightTap();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setTouchActive(false);
    lastTouchRef.current = null;
  };

  const handleTap = () => {
    haptics.mediumImpact();
    soundFX.playClick(800, 0.04);
    onSendCommand('Select');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-3 select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between w-full mb-3 p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <MousePointer className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-200">Trackpad & Air Mouse TV</h3>
            <p className="text-[11px] text-slate-400">Puntero de navegación táctil y giroscópico</p>
          </div>
        </div>

        {/* Gyro Air Mouse Toggle */}
        <button
          onClick={requestGyroPermission}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            gyroEnabled
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] animate-pulse'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Air Mouse: {gyroEnabled ? 'ACTIVO' : 'DESACTIVADO'}</span>
        </button>
      </div>

      {/* Main Touch Area */}
      <div
        ref={trackpadRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleTap}
        className={`relative w-full h-80 sm:h-96 rounded-3xl border-2 transition-all cursor-crosshair flex flex-col items-center justify-center overflow-hidden ${
          touchActive || gyroEnabled
            ? 'bg-slate-900 border-cyan-400/80 shadow-[0_0_30px_rgba(56,189,248,0.25)]'
            : 'bg-slate-950 border-slate-800 shadow-inner'
        }`}
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Virtual Pointer Cursor */}
        <div
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute pointer-events-none transition-all duration-75 flex flex-col items-center"
        >
          <div className="w-6 h-6 rounded-full bg-cyan-400/30 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.8)]">
            <div className="w-2 h-2 rounded-full bg-cyan-300" />
          </div>
          <span className="text-[9px] font-mono font-bold text-cyan-300 mt-1 bg-slate-950/80 px-1 rounded border border-cyan-800">
            TV Pointer
          </span>
        </div>

        {/* Center Instructions */}
        <div className="flex flex-col items-center text-center pointer-events-none px-6 z-0 opacity-40">
          <Move className="w-10 h-10 text-slate-400 mb-2" />
          <span className="text-sm font-semibold text-slate-300">Desliza el dedo para mover el cursor</span>
          <span className="text-xs text-slate-500 mt-0.5">Toca una vez para hacer CLICK / SELECCIONAR</span>
        </div>

        {/* Scroll strip on right */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-slate-900/50 border-l border-slate-800 flex flex-col items-center justify-between py-4 pointer-events-none">
          <span className="text-[9px] font-mono text-slate-500 rotate-90">SCROLL</span>
          <div className="w-1.5 h-16 bg-slate-700/60 rounded-full" />
          <span className="text-[9px] font-mono text-slate-500 rotate-90">▲ / ▼</span>
        </div>
      </div>

      {/* Mouse Buttons Bar (Left Click, Scroll Up, Scroll Down, Right Click) */}
      <div className="grid grid-cols-4 gap-3 w-full mt-4">
        <button
          onClick={() => {
            haptics.mediumImpact();
            soundFX.playClick(700);
            onSendCommand('Select');
          }}
          className="py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 text-slate-200 rounded-2xl font-bold text-xs flex flex-col items-center justify-center transition-all shadow-md"
        >
          <span className="font-mono text-sm">CLICK IZQ</span>
          <span className="text-[9px] text-slate-400 uppercase">Seleccionar</span>
        </button>

        <button
          onClick={() => {
            haptics.lightTap();
            soundFX.playClick(500);
            onSendCommand('Up');
          }}
          className="py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 text-slate-200 rounded-2xl font-bold text-xs flex flex-col items-center justify-center transition-all shadow-md"
        >
          <span className="font-mono text-sm">SCROLL ▲</span>
          <span className="text-[9px] text-slate-400 uppercase">Subir</span>
        </button>

        <button
          onClick={() => {
            haptics.lightTap();
            soundFX.playClick(500);
            onSendCommand('Down');
          }}
          className="py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 text-slate-200 rounded-2xl font-bold text-xs flex flex-col items-center justify-center transition-all shadow-md"
        >
          <span className="font-mono text-sm">SCROLL ▼</span>
          <span className="text-[9px] text-slate-400 uppercase">Bajar</span>
        </button>

        <button
          onClick={() => {
            haptics.mediumImpact();
            soundFX.playClick(700);
            onSendCommand('Back');
          }}
          className="py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 text-slate-200 rounded-2xl font-bold text-xs flex flex-col items-center justify-center transition-all shadow-md"
        >
          <span className="font-mono text-sm">CLICK DER</span>
          <span className="text-[9px] text-slate-400 uppercase">Atrás / Salir</span>
        </button>
      </div>
    </div>
  );
};
