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
  Smartphone
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
  const [logMessage, setLogMessage] = useState<string>('');
  const [currentBtDevice, setCurrentBtDevice] = useState<BluetoothTvDevice | null>(null);
  const [isSyncingCombo, setIsSyncingCombo] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

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

  const handleScanOrPair = async () => {
    setIsConnecting(true);
    haptics.mediumImpact();
    soundFX.playClick(700);

    const result = await bluetoothManager.connectBluetooth('tcl_tv');
    setIsConnecting(false);

    if (result.success && bluetoothManager.activeDevice) {
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

    // Send Home + Select (Inicio + OK)
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
              <h2 className="text-base font-bold text-neutral-100">
                Sincronización & Modo Bluetooth
              </h2>
              <p className="text-xs text-neutral-400">
                Mando de Consola inalámbrico para Smart TV TCL
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

        {/* 1m Distance Reminder */}
        <div className="my-3 p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-neutral-400 animate-pulse shrink-0" />
            <span>Ubíquese aproximadamente a <strong>1 metro</strong> de la TV durante la sincronización.</span>
          </div>
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-neutral-900 rounded border border-neutral-700">
            ~1m
          </span>
        </div>

        {/* Connection & Pairing Card */}
        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${currentBtDevice ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'}`} />
              <span className="text-xs font-bold text-neutral-200">
                {currentBtDevice ? `Mando Activo: ${currentBtDevice.name}` : 'Mando Inalámbrico Listo'}
              </span>
            </div>

            <span className="px-2 py-0.5 text-[10px] font-mono bg-neutral-900 border border-neutral-700 rounded text-neutral-300 font-semibold">
              Wireless Controller
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Primary Action: Sincronizar Inicio + OK (3s) */}
            <button
              onClick={handleBluetoothSyncPairing}
              disabled={isSyncingCombo}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl font-bold text-xs border border-neutral-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>{isSyncingCombo ? 'Sincronizando señal Inicio + OK (3s)...' : '⚡ Sincronizar Inicio + OK (3s)'}</span>
            </button>

            {/* Secondary Action: Bluetooth Native Discovery */}
            <button
              onClick={handleScanOrPair}
              disabled={isConnecting}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-medium text-xs border border-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              <Bluetooth className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>{isConnecting ? 'Buscando TV...' : 'Buscar TV por Bluetooth Directo'}</span>
            </button>
          </div>

          {/* Log message */}
          {logMessage && (
            <p className="mt-3 text-[11px] font-mono text-neutral-400 truncate border-t border-neutral-800/80 pt-2">
              &bull; {logMessage}
            </p>
          )}
        </div>

        {/* Successful Sync Notification */}
        {syncDone && (
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 flex items-center gap-2 mb-4 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>¡Señal de Inicio + OK transmitida con éxito! Tu Smart TV TCL ya reconoce el control.</span>
          </div>
        )}

        {/* Clear Instructions */}
        <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs text-neutral-300 space-y-2 mb-4">
          <span className="font-bold text-neutral-200 block text-xs">
            Instrucciones para tu Smart TV TCL:
          </span>
          <ol className="list-decimal list-inside space-y-1 text-neutral-400 text-[11px] leading-relaxed">
            <li>En tu televisor TCL ve a <strong>Ajustes &gt; Mandos y Accesorios</strong>.</li>
            <li>Coloca tu móvil a <strong>1 metro</strong> del televisor.</li>
            <li>Pulsa el botón <strong>"⚡ Sincronizar Inicio + OK (3s)"</strong> arriba.</li>
            <li>La TV TCL emparejará el mando como <strong>Wireless Controller</strong>.</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold"
          >
            Listo, ir al Mando
          </button>
        </div>

      </div>
    </div>
  );
};
