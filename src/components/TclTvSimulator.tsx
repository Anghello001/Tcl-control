import React, { useState, useEffect } from 'react';
import { TvDevice } from '../types.ts';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  CircleDot
} from 'lucide-react';

interface TclTvSimulatorProps {
  device: TvDevice | null;
  lastCommand: string;
}

export const TclTvSimulator: React.FC<TclTvSimulatorProps> = ({
  device,
  lastCommand,
}) => {
  const [showVolumeHud, setShowVolumeHud] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (!lastCommand) return;

    if (lastCommand === 'VolumeUp' || lastCommand === 'VolumeDown' || lastCommand === 'VolumeMute') {
      setShowVolumeHud(true);
      const timer = setTimeout(() => setShowVolumeHud(false), 2000);
      return () => clearTimeout(timer);
    }

    if (lastCommand === 'Right') {
      setFocusedIndex(prev => (prev + 1) % 4);
    } else if (lastCommand === 'Left') {
      setFocusedIndex(prev => (prev - 1 + 4) % 4);
    } else if (lastCommand === 'Down' || lastCommand === 'Up') {
      setFocusedIndex(prev => (prev + 2) % 4);
    }
  }, [lastCommand]);

  const apps = [
    { title: 'TCL Game Center', sub: 'Game Master 144Hz' },
    { title: 'GeForce NOW', sub: 'Cloud Gaming' },
    { title: 'YouTube', sub: '4K HDR' },
    { title: 'HDMI 1', sub: 'Consola' },
  ];

  if (!device) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-4 px-2 select-none">
      <div className="bg-neutral-900/90 rounded-2xl p-3 border border-neutral-800 shadow-md">
        
        {/* Screen Header */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-2 px-1">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-bold text-neutral-200">TCL TV</span>
            <span>&bull; {device.currentApp}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-neutral-400">{device.latencyMs} ms</span>
          </div>
        </div>

        {/* 4K Minimal Screen Panel */}
        <div className="relative w-full aspect-[21/9] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex flex-col justify-between p-3">
          
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {device.inputSource}
            </span>
            {device.gameMode && (
              <span className="text-[10px] font-mono text-neutral-300 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                144Hz VRR
              </span>
            )}
          </div>

          {/* Quick TV App Grid */}
          <div className="grid grid-cols-4 gap-2 my-auto z-10">
            {apps.map((item, idx) => {
              const isSelected = focusedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isSelected
                      ? 'bg-neutral-800 border-neutral-300 text-white scale-105 shadow-sm'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <span className="text-[11px] font-bold block truncate">{item.title}</span>
                  <span className="text-[9px] text-neutral-500 block truncate">{item.sub}</span>
                </div>
              );
            })}
          </div>

          {/* Volume HUD */}
          {showVolumeHud && (
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 z-20 bg-neutral-900/95 border border-neutral-700 p-3 rounded-xl flex items-center gap-3 animate-in fade-in">
              {device.muted ? <VolumeX className="w-5 h-5 text-neutral-400" /> : <Volume2 className="w-5 h-5 text-neutral-200" />}
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-mono text-neutral-300 mb-1">
                  <span>VOLUMEN</span>
                  <span>{device.muted ? 'MUTE' : `${device.volume}%`}</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-200 rounded-full"
                    style={{ width: device.muted ? '0%' : `${device.volume}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="text-[9px] font-mono text-neutral-500 text-center z-10">
            IP: {device.ip} &bull; Sincronizado a ~1m
          </div>
        </div>

      </div>
    </div>
  );
};
