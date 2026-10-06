import React, { useState } from 'react';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Power, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  RotateCcw, 
  Tv, 
  Play, 
  Pause, 
  Mic, 
  Bot, 
  Radio, 
  Zap 
} from 'lucide-react';

interface SmartTvRemoteProps {
  device: TvDevice | null;
  onSendCommand: (cmd: string, type?: 'press' | 'down' | 'up') => void;
  onLaunchApp: (appId: string) => void;
  onOpenPairingModal: () => void;
}

export const SmartTvRemote: React.FC<SmartTvRemoteProps> = ({
  device,
  onSendCommand,
  onLaunchApp,
  onOpenPairingModal,
}) => {
  const [activeButtons, setActiveButtons] = useState<Record<string, boolean>>({});

  const handlePointerDown = (cmd: string, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveButtons(prev => ({ ...prev, [cmd]: true }));
    haptics.lightTap();
    soundFX.playClick(cmd === 'Power' ? 800 : 550);
    onSendCommand(cmd, 'down');
  };

  const handlePointerUp = (cmd: string, e: React.PointerEvent) => {
    e.preventDefault();
    setActiveButtons(prev => ({ ...prev, [cmd]: false }));
    onSendCommand(cmd, 'up');
  };

  const send = (cmd: string) => {
    setActiveButtons(prev => ({ ...prev, [cmd]: true }));
    haptics.lightTap();
    soundFX.playClick(cmd === 'Power' ? 800 : 550);
    setTimeout(() => {
      setActiveButtons(prev => ({ ...prev, [cmd]: false }));
    }, 120);
    onSendCommand(cmd, 'press');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto p-2 select-none">
      <div className="w-full bg-neutral-900/95 rounded-3xl p-6 border border-neutral-800 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-wider text-neutral-100 font-mono">TCL</span>
            <span className="text-xs text-neutral-400">Control Remoto</span>
          </div>

          <button
            onClick={() => send('Power')}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
              device?.powerState === 'standby'
                ? 'bg-neutral-950 text-neutral-600 border-neutral-800'
                : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Sincronizar Inicio + OK Bar */}
        <div className="mb-5 p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-200 block">Sincronización TCL</span>
            <span className="text-[11px] text-neutral-400">Inicio + OK a 1m de la TV</span>
          </div>

          <button
            onClick={onOpenPairingModal}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium border border-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sincronizar</span>
          </button>
        </div>

        {/* Minimal D-Pad (Multi-touch support) */}
        <div className="relative w-44 h-44 mx-auto mb-5 bg-neutral-950 rounded-full border border-neutral-800 flex items-center justify-center touch-none">
          {/* OK / SELECT Button (Can be held simultaneously with Home) */}
          <button
            onPointerDown={(e) => handlePointerDown('Select', e)}
            onPointerUp={(e) => handlePointerUp('Select', e)}
            onPointerCancel={(e) => handlePointerUp('Select', e)}
            className={`w-16 h-16 rounded-full border z-10 flex items-center justify-center font-bold text-sm transition-all ${
              activeButtons['Select']
                ? 'bg-neutral-200 text-neutral-950 border-white shadow-md'
                : 'bg-neutral-800 text-neutral-100 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            OK
          </button>

          {/* UP */}
          <button
            onPointerDown={(e) => handlePointerDown('Up', e)}
            onPointerUp={(e) => handlePointerUp('Up', e)}
            onPointerCancel={(e) => handlePointerUp('Up', e)}
            className={`absolute top-2 w-12 h-10 rounded-t-2xl flex items-center justify-center transition-all ${
              activeButtons['Up'] ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* DOWN */}
          <button
            onPointerDown={(e) => handlePointerDown('Down', e)}
            onPointerUp={(e) => handlePointerUp('Down', e)}
            onPointerCancel={(e) => handlePointerUp('Down', e)}
            className={`absolute bottom-2 w-12 h-10 rounded-b-2xl flex items-center justify-center transition-all ${
              activeButtons['Down'] ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* LEFT */}
          <button
            onPointerDown={(e) => handlePointerDown('Left', e)}
            onPointerUp={(e) => handlePointerUp('Left', e)}
            onPointerCancel={(e) => handlePointerUp('Left', e)}
            className={`absolute left-2 w-10 h-12 rounded-l-2xl flex items-center justify-center transition-all ${
              activeButtons['Left'] ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* RIGHT */}
          <button
            onPointerDown={(e) => handlePointerDown('Right', e)}
            onPointerUp={(e) => handlePointerUp('Right', e)}
            onPointerCancel={(e) => handlePointerUp('Right', e)}
            className={`absolute right-2 w-10 h-12 rounded-r-2xl flex items-center justify-center transition-all ${
              activeButtons['Right'] ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation row (Back, Home, Asistente) */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            onPointerDown={(e) => handlePointerDown('Back', e)}
            onPointerUp={(e) => handlePointerUp('Back', e)}
            onPointerCancel={(e) => handlePointerUp('Back', e)}
            className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
              activeButtons['Back'] ? 'bg-neutral-700 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-300'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px]">Atrás</span>
          </button>

          {/* INICIO (HOME) */}
          <button
            onPointerDown={(e) => handlePointerDown('Home', e)}
            onPointerUp={(e) => handlePointerUp('Home', e)}
            onPointerCancel={(e) => handlePointerUp('Home', e)}
            className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
              activeButtons['Home']
                ? 'bg-neutral-200 text-neutral-950 border-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-200 hover:border-neutral-600'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] font-bold">Inicio</span>
          </button>

          <button
            onPointerDown={(e) => handlePointerDown('Voice', e)}
            onPointerUp={(e) => handlePointerUp('Voice', e)}
            onPointerCancel={(e) => handlePointerUp('Voice', e)}
            className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
              activeButtons['Voice'] ? 'bg-neutral-700 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="text-[10px]">Voz</span>
          </button>
        </div>

        {/* Volume & Mute Row */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-neutral-950 rounded-2xl border border-neutral-800 items-center">
          <button
            onClick={() => send('VolumeDown')}
            className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold"
          >
            VOL -
          </button>

          <button
            onClick={() => send('VolumeMute')}
            className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold flex items-center justify-center gap-1"
          >
            {device?.muted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => send('VolumeUp')}
            className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold"
          >
            VOL +
          </button>
        </div>

      </div>
    </div>
  );
};
