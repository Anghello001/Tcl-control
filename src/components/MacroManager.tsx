import React, { useState } from 'react';
import { TvDevice, MacroProfile, MacroAction } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { Flame, Play, Plus, Trash2, CheckCircle2, Sparkles, Zap, RotateCcw } from 'lucide-react';

interface MacroManagerProps {
  device: TvDevice | null;
  onSendCommand: (cmd: string, type?: 'press' | 'down' | 'up') => void;
}

export const MacroManager: React.FC<MacroManagerProps> = ({
  device,
  onSendCommand,
}) => {
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(-1);

  const defaultMacros: MacroProfile[] = [
    {
      id: 'game-master-boost',
      name: 'Game Master 144Hz ALLM',
      description: 'Activa modo baja latencia, ALLM y sincronización de refresco en TCL TV',
      icon: 'Zap',
      category: 'gaming',
      actions: [
        { command: 'Home', delayMs: 400 },
        { command: 'ToggleGameMode', delayMs: 300 },
        { command: 'Select', delayMs: 200 },
      ],
    },
    {
      id: 'quick-youtube-gaming',
      name: 'Entrar a YouTube 4K',
      description: 'Lanza YouTube, pulsa OK y enfoca la barra de búsqueda',
      icon: 'Play',
      category: 'shortcut',
      actions: [
        { command: 'Home', delayMs: 500 },
        { command: 'Down', delayMs: 300 },
        { command: 'Select', delayMs: 400 },
      ],
    },
    {
      id: 'street-fighter-combo',
      name: 'Combo Hadouken (↓ ↘ → + A)',
      description: 'Ejecuta combo arcade clásico para juegos de lucha y emuladores',
      icon: 'Flame',
      category: 'gaming',
      actions: [
        { command: 'Down', delayMs: 120 },
        { command: 'Right', delayMs: 120 },
        { command: 'ButtonA', delayMs: 150 },
      ],
    },
    {
      id: 'night-mode-audio',
      name: 'Modo Noche (Volumen Bajo)',
      description: 'Reduce el volumen 6 niveles rápidamente para no molestar de noche',
      icon: 'RotateCcw',
      category: 'navigation',
      actions: [
        { command: 'VolumeDown', delayMs: 120 },
        { command: 'VolumeDown', delayMs: 120 },
        { command: 'VolumeDown', delayMs: 120 },
      ],
    },
  ];

  const executeMacro = async (macro: MacroProfile) => {
    if (isExecuting) return;
    setIsExecuting(macro.id);
    haptics.heavyImpact();
    soundFX.playSuccess();

    for (let i = 0; i < macro.actions.length; i++) {
      setActiveStep(i);
      const act = macro.actions[i];
      soundFX.playClick(600 + i * 50, 0.03);
      haptics.lightTap();
      onSendCommand(act.command, act.type || 'press');
      await new Promise(r => setTimeout(r, act.delayMs || 250));
    }

    setIsExecuting(null);
    setActiveStep(-1);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-4 select-none">
      <div className="flex items-center justify-between mb-4 p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Macros & Combos de Juego TCL
          </h3>
          <p className="text-xs text-slate-400">
            Automatiza secuencias de botones de mando y accesos rápidos en tu televisor
          </p>
        </div>
      </div>

      {/* Macros List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {defaultMacros.map(macro => {
          const isRunning = isExecuting === macro.id;

          return (
            <div
              key={macro.id}
              className={`p-4 rounded-2xl border-2 transition-all bg-slate-900/90 flex flex-col justify-between ${
                isRunning
                  ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {macro.name}
                  </h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                    {macro.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">{macro.description}</p>

                {/* Sequence visualization */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {macro.actions.map((act, idx) => (
                    <div
                      key={idx}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all ${
                        isRunning && activeStep === idx
                          ? 'bg-amber-400 text-slate-950 border-white scale-110'
                          : 'bg-slate-950 text-slate-300 border-slate-700'
                      }`}
                    >
                      {act.command}
                    </div>
                  ))}
                </div>
              </div>

              {/* Run button */}
              <button
                onClick={() => executeMacro(macro)}
                disabled={!!isExecuting}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isRunning
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isRunning ? 'Ejecutando Combo...' : 'Ejecutar Macro'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
