import React from 'react';
import { TvDevice, ControllerMode } from '../types.ts';
import { BluetoothTvDevice } from '../services/bluetoothGamepadService.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Gamepad2, 
  Tv, 
  MousePointer, 
  Grid, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Tv2,
  Maximize2, 
  Minimize2,
  Radio,
  Bluetooth,
  Activity,
  Smartphone
} from 'lucide-react';

interface NavbarProps {
  currentMode: ControllerMode;
  onSelectMode: (mode: ControllerMode) => void;
  device: TvDevice | null;
  bluetoothDevice: BluetoothTvDevice | null;
  onOpenScanner: () => void;
  onOpenPairing: () => void;
  onOpenBluetooth: () => void;
  onOpenDiagnostics: () => void;
  onOpenBitrise: () => void;
  showSimulator: boolean;
  onToggleSimulator: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  device,
  bluetoothDevice,
  onOpenScanner,
  onOpenPairing,
  onOpenBluetooth,
  onOpenDiagnostics,
  onOpenBitrise,
  showSimulator,
  onToggleSimulator,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const tabs = [
    { id: 'gamepad' as ControllerMode, label: 'Mando Consola', icon: Gamepad2 },
    { id: 'remote' as ControllerMode, label: 'Mando TV', icon: Tv },
    { id: 'trackpad' as ControllerMode, label: 'Air Mouse', icon: MousePointer },
    { id: 'apps' as ControllerMode, label: 'Apps', icon: Grid },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-3 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        
        {/* Brand & Connection Badges */}
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-zinc-100 tracking-wider">TCL</span>
          
          {/* Bluetooth Status */}
          <button
            onClick={onOpenBluetooth}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-colors border ${
              bluetoothDevice
                ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Conexión Bluetooth (Mando Inalámbrico)"
          >
            <Bluetooth className={`w-3.5 h-3.5 ${bluetoothDevice ? 'text-zinc-100' : 'text-zinc-400'}`} />
            <span className="font-mono text-[11px] hidden sm:inline">
              {bluetoothDevice ? bluetoothDevice.name.slice(0, 12) : 'Bluetooth'}
            </span>
          </button>

          {/* Wi-Fi / IP Diagnostics Button */}
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-300 transition-colors"
            title="Diagnóstico de IP y Red Wi-Fi"
          >
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono text-[11px] hidden md:inline">{device?.ip || 'IP / Red'}</span>
          </button>

          {/* Bitrise APK Button */}
          <button
            onClick={onOpenBitrise}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 rounded-xl text-xs text-purple-300 transition-colors shadow-sm"
            title="Generar APK Android con Bitrise"
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium text-[11px]">APK Bitrise</span>
          </button>
        </div>

        {/* Minimal Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          {tabs.map(tab => {
            const IconComp = tab.icon;
            const isSelected = currentMode === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptics.lightTap();
                  soundFX.playClick();
                  onSelectMode(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions (Pairing, Fullscreen, Audio, Simulator) */}
        <div className="flex items-center gap-1.5">
          {/* Sincronizar Inicio+OK */}
          <button
            onClick={() => {
              haptics.mediumImpact();
              soundFX.playSuccess();
              onOpenPairing();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition-colors"
            title="Sincronizar Inicio + OK a ~1m"
          >
            <Radio className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Sincronizar (1m)</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* TV Simulator Toggle */}
          <button
            onClick={onToggleSimulator}
            className={`p-1.5 rounded-xl border transition-colors ${
              showSimulator
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-zinc-950 text-zinc-600 border-zinc-900'
            }`}
            title="Mostrar/Ocultar Pantalla TV"
          >
            <Tv2 className="w-4 h-4" />
          </button>

          {/* Sound */}
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Haptics */}
          <button
            onClick={onToggleHaptics}
            className={`p-1.5 rounded-xl border transition-colors ${
              hapticsEnabled ? 'text-zinc-300 border-zinc-800 bg-zinc-900' : 'text-zinc-600 border-zinc-900 bg-zinc-950'
            }`}
          >
            <Vibrate className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
