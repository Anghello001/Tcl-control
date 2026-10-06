import React, { useState, useEffect } from 'react';
import { BluetoothTvDevice, bluetoothManager } from '../services/bluetoothGamepadService.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Bluetooth, 
  Tv, 
  Gamepad2, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Info,
  CircleDot
} from 'lucide-react';

interface BluetoothPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBluetoothConnected: (device: BluetoothTvDevice) => void;
  onSendCommand: (cmd: string, type?: 'press' | 'down' | 'up') => void;
}

export const BluetoothPairingModal: React.FC<BluetoothPairingModalProps> = ({
  isOpen,
  onClose,
  onBluetoothConnected,
  onSendCommand,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(true);
  const [logMessage, setLogMessage] = useState<string>('');
  const [currentBtDevice, setCurrentBtDevice] = useState<BluetoothTvDevice | null>(null);
  const [isSyncingCombo, setIsSyncingCombo] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  useEffect(() => {
    setBluetoothSupported(typeof navigator !== 'undefined' && 'bluetooth' in navigator);

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
    haptics.mediumImpact();
    soundFX.playClick(700);

    const success = await bluetoothManager.connectBluetooth('tcl_tv');
    setIsConnecting(false);

    if (success && bluetoothManager.activeDevice) {
      soundFX.playSuccess();
      haptics.heavyImpact();
    }
  };

  const handleDisconnect = () => {
    bluetoothManager.disconnect();
    setCurrentBtDevice(null);
    haptics.lightTap();
  };

  const handleBluetoothSyncPairing = async () => {
    setIsSyncingCombo(true);
    setSyncDone(false);
    haptics.heavyImpact();
    soundFX.playClick(600);

    // Send Home + Select via Bluetooth & Gamepad API
    onSendCommand('Home', 'down');
    onSendCommand('Select', 'down');
    await bluetoothManager.sendBluetoothPairingSync();

    setTimeout(() => {
      onSendCommand('Home', 'up');
      onSendCommand('Select', 'up');
      setIsSyncingCombo(false);
      setSyncDone(true);
      soundFX.playSuccess();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200 shadow-sm">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-1.5">
                <span>Modo Bluetooth (Mando de Consola)</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Conexión inalámbrica directa a tu Smart TV TCL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1m Distance Indicator */}
        <div className="my-3 p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-neutral-400 animate-pulse shrink-0" />
            <span>Ubíquese aproximadamente a <strong>1 metro</strong> de la TV durante la sincronización Bluetooth.</span>
          </div>
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-neutral-900 rounded border border-neutral-700">
            ~1m
          </span>
        </div>

        {/* Browser compatibility check */}
        {!bluetoothSupported && (
          <div className="mb-3 p-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs text-neutral-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-200">Requisito de Navegador:</strong>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Web Bluetooth está optimizado para <strong>Google Chrome, Microsoft Edge, Brave y Android Chrome</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status Card */}
        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${currentBtDevice ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'}`} />
              <span className="text-xs font-bold text-neutral-200">
                {currentBtDevice ? `Conectado: ${currentBtDevice.name}` : 'Bluetooth Desconectado'}
              </span>
            </div>

            {currentBtDevice && (
              <span className="px-2 py-0.5 text-[10px] font-mono bg-neutral-900 border border-neutral-700 rounded text-neutral-300 font-semibold">
                Wireless Controller (HID)
              </span>
            )}
          </div>

          {/* Action Buttons: Scan or Disconnect */}
          {currentBtDevice ? (
            <div className="flex gap-2">
              <button
                onClick={handleBluetoothSyncPairing}
                disabled={isSyncingCombo}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl font-bold text-xs border border-neutral-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSyncingCombo ? 'Transmitiendo Inicio+OK...' : 'Sincronizar Inicio + OK (3s)'}</span>
              </button>

              <button
                onClick={handleDisconnect}
                className="px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-xl text-xs font-medium border border-neutral-800"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <button
              onClick={handleScanBluetooth}
              disabled={isConnecting}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl font-bold text-xs border border-neutral-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Bluetooth className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>{isConnecting ? 'Buscando TV TCL por Bluetooth...' : 'Buscar y Conectar TV por Bluetooth'}</span>
            </button>
          )}

          {/* Log / Status text */}
          {logMessage && (
            <p className="mt-2 text-[11px] font-mono text-neutral-400 truncate">
              &bull; {logMessage}
            </p>
          )}
        </div>

        {/* Step-by-Step Pairing Guide for TCL TV */}
        <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs text-neutral-300 space-y-2 mb-4">
          <span className="font-bold text-neutral-200 block text-xs">
            Pasos para que tu TV TCL lo detecte como mando:
          </span>
          <ol className="list-decimal list-inside space-y-1.5 text-neutral-400 text-[11px] leading-relaxed">
            <li>En tu TV TCL ve a <strong>Ajustes &gt; Mandos y Accesorios &gt; Añadir accesorio</strong>.</li>
            <li>La TV empezará a buscar dispositivos Bluetooth cercanos.</li>
            <li>Pulsa el botón <strong>"Buscar y Conectar TV por Bluetooth"</strong> arriba.</li>
            <li>Selecciona tu TV TCL o pulsa <strong>"Sincronizar Inicio + OK"</strong> a 1 metro de distancia.</li>
            <li>La TV lo vinculará como <strong>Mando Inalámbrico / Control Remoto TCL</strong>.</li>
          </ol>
        </div>

        {/* Success confirmation */}
        {syncDone && (
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 flex items-center gap-2 mb-4 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>¡Señal Bluetooth de Inicio + OK transmitida con éxito! Tu TV TCL debe confirmar la vinculación en pantalla.</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
