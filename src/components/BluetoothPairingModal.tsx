import React, { useState, useEffect } from 'react';
import { BluetoothTvDevice, bluetoothManager } from '../services/bluetoothGamepadService.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Bluetooth, 
  Tv, 
  Gamepad2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Zap, 
  Info,
  Smartphone,
  Wifi,
  Terminal
} from 'lucide-react';

interface BluetoothPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBluetoothConnected: (device: BluetoothTvDevice) => void;
  onOpenWifiModal: () => void;
}

export const BluetoothPairingModal: React.FC<BluetoothPairingModalProps> = ({
  isOpen,
  onClose,
  onBluetoothConnected,
  onOpenWifiModal,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [logMessage, setLogMessage] = useState<string>('');
  const [currentBtDevice, setCurrentBtDevice] = useState<BluetoothTvDevice | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const unsub = bluetoothManager.subscribe((connected, dev, log) => {
      setCurrentBtDevice(dev);
      setLogMessage(log);
      if (connected && dev) {
        onBluetoothConnected(dev);
      }
    });

    return () => unsub();
  }, [onBluetoothConnected]);

  if (!isOpen) return null;

  const handleScanBluetooth = async () => {
    setIsConnecting(true);
    setErrorMessage('');
    haptics.mediumImpact();
    soundFX.playClick(700);

    const result = await bluetoothManager.connectBluetooth('gamepad');
    setIsConnecting(false);

    if (result.success) {
      soundFX.playSuccess();
      haptics.heavyImpact();
    } else if (result.error) {
      setErrorMessage(result.error);
    }
  };

  const handleDisconnect = () => {
    bluetoothManager.disconnect();
    setCurrentBtDevice(null);
    haptics.lightTap();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Sincronización Bluetooth & Mando Físico
              </h2>
              <p className="text-[11px] text-zinc-400">
                Información técnica y puente de mandos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
          
          {/* Reality Notice Box */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>¿Por qué la TV no detecta el Bluetooth de una Web App?</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Por estándares internacionales de seguridad web, los navegadores (Chrome, Safari) solo pueden <b>recibir</b> dispositivos, <b>no pueden emitir señales como un control remoto Bluetooth físico</b>. El televisor solo detecta periféricos de hardware en su menú de emparejamiento.
            </p>
          </div>

          {/* Connected state */}
          {currentBtDevice ? (
            <div className="p-4 bg-zinc-900 border border-emerald-500/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="font-semibold text-zinc-100">{currentBtDevice.name}</div>
                  <div className="text-[10px] text-emerald-400">Mando Bluetooth conectado al navegador</div>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option 1: Connect Physical Gamepad via Bluetooth */}
              <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  <span>Opción 1: Conectar Mando Físico al Navegador</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Conecta tu mando de PS4, PS5, Xbox o Switch a tu móvil o PC. Esta app capturará tus botones físicos y los enviará al televisor TCL por Wi-Fi.
                </p>
                <button
                  onClick={handleScanBluetooth}
                  disabled={isConnecting}
                  className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 text-zinc-100 font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                  {isConnecting ? 'Buscando mandos Bluetooth...' : 'Vincular Mando Físico (Bluetooth)'}
                </button>
              </div>

              {/* Option 2: Wi-Fi Direct Control (Recommended) */}
              <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span>Opción 2: Control Directo por Wi-Fi (Recomendado)</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  El protocolo Wi-Fi es la forma oficial en que las aplicaciones controlan televisores TCL (Roku ECP, Android ADB o Google TV Remote).
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenWifiModal();
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  Configurar Conexión Wi-Fi del TV
                </button>
              </div>
            </div>
          )}

          {/* Status / Error feedback */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {logMessage && (
            <div className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-lg text-zinc-400 text-[10px] font-mono flex items-center gap-2">
              <Terminal className="w-3 h-3 text-zinc-500" />
              <span className="truncate">{logMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
