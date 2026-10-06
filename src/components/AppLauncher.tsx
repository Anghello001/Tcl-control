import React, { useState } from 'react';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Gamepad2, 
  Gamepad, 
  Joystick, 
  Tv, 
  Film, 
  Music, 
  Radio, 
  Sparkles, 
  Globe, 
  Settings, 
  CheckCircle2, 
  Play,
  Zap,
  Sliders
} from 'lucide-react';

interface AppLauncherProps {
  device: TvDevice | null;
  onLaunchApp: (appId: string) => void;
  onSendCommand: (cmd: string) => void;
}

export const AppLauncher: React.FC<AppLauncherProps> = ({
  device,
  onLaunchApp,
  onSendCommand,
}) => {
  const [filter, setFilter] = useState<'all' | 'gaming' | 'video' | 'streaming'>('all');
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);

  const apps = [
    {
      id: 'game-center',
      name: 'TCL Game Center',
      sub: 'Centro de Juegos TCL Game Master',
      icon: Gamepad2,
      category: 'gaming',
      badge: 'Game Master 144Hz',
      color: 'from-amber-500/20 to-orange-600/30 border-amber-500/40 text-amber-400',
    },
    {
      id: 'geforce-now',
      name: 'NVIDIA GeForce NOW',
      sub: 'Cloud Gaming RTX 4080',
      icon: Gamepad,
      category: 'gaming',
      badge: 'Cloud Gaming',
      color: 'from-emerald-500/20 to-green-600/30 border-emerald-500/40 text-emerald-400',
    },
    {
      id: 'retroarch',
      name: 'RetroArch Arcade',
      sub: 'Emuladores de Consolas Retro',
      icon: Joystick,
      category: 'gaming',
      badge: 'Emulador',
      color: 'from-purple-500/20 to-indigo-600/30 border-purple-500/40 text-purple-400',
    },
    {
      id: 'xbox-cloud',
      name: 'Xbox Cloud Gaming',
      sub: 'Xbox Game Pass Ultimate',
      icon: Tv,
      category: 'gaming',
      badge: 'Xbox',
      color: 'from-green-500/20 to-emerald-600/30 border-green-500/40 text-green-400',
    },
    {
      id: 'youtube',
      name: 'YouTube 4K HDR',
      sub: 'Videos y Gameplays',
      icon: Film,
      category: 'video',
      badge: '4K HDR',
      color: 'from-red-500/20 to-rose-600/30 border-red-500/40 text-red-400',
    },
    {
      id: 'netflix',
      name: 'Netflix',
      sub: 'Películas y Series Dolby Vision',
      icon: Film,
      category: 'video',
      badge: 'Dolby Vision',
      color: 'from-rose-500/20 to-red-600/30 border-rose-500/40 text-rose-400',
    },
    {
      id: 'twitch',
      name: 'Twitch TV',
      sub: 'Transmisiones en Vivo de Videojuegos',
      icon: Radio,
      category: 'streaming',
      badge: 'En Vivo',
      color: 'from-violet-500/20 to-purple-600/30 border-violet-500/40 text-violet-400',
    },
    {
      id: 'spotify',
      name: 'Spotify TV',
      sub: 'Música de fondo mientras juegas',
      icon: Music,
      category: 'streaming',
      badge: 'Audio',
      color: 'from-emerald-500/20 to-teal-600/30 border-emerald-500/40 text-emerald-300',
    },
    {
      id: 'prime-video',
      name: 'Prime Video',
      sub: 'Amazon Originals & Series',
      icon: Tv,
      category: 'video',
      badge: 'HDR10+',
      color: 'from-sky-500/20 to-blue-600/30 border-sky-500/40 text-sky-400',
    },
    {
      id: 'disney-plus',
      name: 'Disney+',
      sub: 'Marvel, Star Wars, Pixar',
      icon: Sparkles,
      category: 'video',
      badge: 'IMAX Enhanced',
      color: 'from-blue-500/20 to-indigo-600/30 border-blue-500/40 text-blue-400',
    },
  ];

  const handleLaunch = (appId: string) => {
    setLaunchingApp(appId);
    haptics.mediumImpact();
    soundFX.playSuccess();
    onLaunchApp(appId);

    setTimeout(() => {
      setLaunchingApp(null);
    }, 1200);
  };

  const filteredApps = filter === 'all' ? apps : apps.filter(a => a.category === filter);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-3">
      {/* Header with Game Master Quick Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-4 bg-slate-900/80 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            Lanzador de Apps & Juegos TCL
          </h2>
          <p className="text-xs text-slate-400">
            Ejecuta aplicaciones y juegos en tu Smart TV TCL con 1 solo toque
          </p>
        </div>

        {/* Input Switchers */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 px-1">HDMI:</span>
          {['HDMI 1', 'HDMI 2', 'HDMI 3'].map(hdmi => (
            <button
              key={hdmi}
              onClick={() => {
                haptics.lightTap();
                soundFX.playClick();
                onSendCommand(hdmi);
              }}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                device?.inputSource === hdmi
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {hdmi}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Todas las Apps' },
          { id: 'gaming', label: '🎮 Juegos & Consolas' },
          { id: 'video', label: '🎬 Cine & Series' },
          { id: 'streaming', label: '📻 Streaming & Música' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              haptics.lightTap();
              soundFX.playClick();
              setFilter(tab.id as any);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredApps.map(app => {
          const IconComp = app.icon;
          const isCurrent = device?.currentApp?.toLowerCase().includes(app.name.toLowerCase().split(' ')[0]);
          const isLaunching = launchingApp === app.id;

          return (
            <div
              key={app.id}
              onClick={() => handleLaunch(app.id)}
              className={`group relative p-4 rounded-2xl border-2 bg-gradient-to-br transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] flex items-center justify-between ${app.color} ${
                isCurrent ? 'ring-2 ring-cyan-400 border-cyan-400' : 'hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-center shadow-inner group-hover:border-cyan-400 transition-colors">
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-100">{app.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{app.sub}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-slate-950/60 border border-slate-700/60 text-slate-300">
                    {app.badge}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center">
                {isLaunching ? (
                  <span className="px-2.5 py-1 text-xs font-bold text-cyan-300 bg-cyan-950 rounded-lg border border-cyan-500 animate-pulse">
                    Abriendo...
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-cyan-400">
                    <CheckCircle2 className="w-4 h-4" />
                    En TV
                  </span>
                ) : (
                  <button className="p-2 rounded-xl bg-slate-950/70 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors text-slate-300 border border-slate-700">
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
