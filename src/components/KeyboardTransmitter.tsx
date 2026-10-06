import React, { useState } from 'react';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { Keyboard, Send, Trash2, Search, Youtube, Film } from 'lucide-react';

interface KeyboardTransmitterProps {
  device: TvDevice | null;
  onSendText: (text: string) => void;
  onSendCommand: (cmd: string) => void;
}

export const KeyboardTransmitter: React.FC<KeyboardTransmitterProps> = ({
  device,
  onSendText,
  onSendCommand,
}) => {
  const [text, setText] = useState('');
  const [history, setHistory] = useState<string[]>([
    'Elden Ring Gameplay 4K',
    'Forza Motorsport 144Hz',
    'Cyberpunk 2077 Benchmark',
    'Canciones Gaming 2026',
  ]);

  const handleSend = (valueToSend?: string) => {
    const val = valueToSend || text;
    if (!val.trim()) return;

    haptics.mediumImpact();
    soundFX.playSuccess();
    onSendText(val);

    if (!history.includes(val)) {
      setHistory([val, ...history.slice(0, 6)]);
    }

    if (!valueToSend) setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
      onSendCommand('Select');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto p-4 bg-slate-900/80 rounded-3xl border border-slate-800 shadow-xl">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <Keyboard className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">Teclado Virtual & Búsqueda para TV</h3>
          <p className="text-[11px] text-slate-400">Escribe en tu móvil para buscar en Netflix, YouTube o juegos</p>
        </div>
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe título de juego, película o video..."
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
          />
          {text && (
            <button
              onClick={() => setText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => handleSend()}
          disabled={!text.trim()}
          className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>Enviar</span>
        </button>
      </div>

      {/* Quick search tags */}
      <div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Búsquedas Rápidas & Historial:
        </span>
        <div className="flex flex-wrap gap-2">
          {history.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item)}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300 font-medium transition-colors flex items-center gap-1.5"
            >
              <span>{item}</span>
              <Send className="w-3 h-3 text-cyan-400 opacity-60" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
