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
  Search
} from 'lucide-react';

interface NavbarProps {
  currentMode: ControllerMode;
  onSelectMode: (mode: ControllerMode) => void;
  device: TvDevice | null;
  bluetoothDevice: BluetoothTvDevice | null;
  onOpenScanner: () => void;
  onOpenPairing: () => void;
  onOpenBluetooth: () => void;
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
    <header className="sticky top-0 z-40 w-full bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-3 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        
        {/* Brand & Connection Badge */}
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-neutral-100 tracking-wider">TCL</span>
          
          {/* Bluetooth Status Pill */}
          <button
            onClick={onOpenBluetooth}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-colors border ${
              bluetoothDevice
                ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Conexión Bluetooth (Mando Inalámbrico)"
          >
            <Bluetooth className={`w-3.5 h-3.5 ${bluetoothDevice ? 'text-neutral-100' : 'text-neutral-400'}`} />
            <span className="font-mono text-[11px] hidden sm:inline">
              {bluetoothDevice ? bluetoothDevice.name.slice(0, 12) : 'Bluetooth'}
            </span>
          </button>

          {/* Wi-Fi Status Pill */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs text-neutral-300 transition-colors"
            title="Conexión Wi-Fi / IP"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] hidden md:inline">{device?.name?.split(' ')[0] || 'Wi-Fi'}</span>
          </button>
        </div>

        {/* Minimal Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-xl border border-neutral-800">
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
                    ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions (Pairing, Bluetooth, Fullscreen, Audio, Simulator) */}
        <div className="flex items-center gap-1.5">
          {/* Sincronizar Inicio+OK */}
          <button
            onClick={() => {
              haptics.mediumImpact();
              soundFX.playSuccess();
              onOpenPairing();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-medium transition-colors"
            title="Sincronizar Inicio + OK a ~1m"
          >
            <Radio className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">Sincronizar (1m)</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* TV Simulator Toggle */}
          <button
            onClick={onToggleSimulator}
            className={`p-1.5 rounded-xl border transition-colors ${
              showSimulator
                ? 'bg-neutral-800 text-neutral-200 border-neutral-700'
                : 'bg-neutral-950 text-neutral-600 border-neutral-900'
            }`}
            title="Mostrar/Ocultar Pantalla TV"
          >
            <Tv2 className="w-4 h-4" />
          </button>

          {/* Sound */}
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Haptics */}
          <button
            onClick={onToggleHaptics}
            className={`p-1.5 rounded-xl border transition-colors ${
              hapticsEnabled ? 'text-neutral-300 border-neutral-800 bg-neutral-900' : 'text-neutral-600 border-neutral-900 bg-neutral-950'
            }`}
          >
            <Vibrate className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
