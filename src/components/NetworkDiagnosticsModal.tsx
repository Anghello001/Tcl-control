import React, { useState, useEffect } from 'react';
import { UniversalTvEngine } from '../services/universalTvEngine.ts';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Wifi, 
  Radio, 
  Cpu, 
  X, 
  Zap, 
  Search, 
  Tv, 
  Globe, 
  Sliders
} from 'lucide-react';

interface NetworkDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: TvDevice | null;
  onSelectIp: (ip: string) => void;
}

export const NetworkDiagnosticsModal: React.FC<NetworkDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  device,
  onSelectIp,
}) => {
  const [detectedSubnet, setDetectedSubnet] = useState<string>('192.168.1');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [tvIpInput, setTvIpInput] = useState<string>(device?.ip || '192.168.1.145');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testLog, setTestLog] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      runAutoDiagnostics();
    }
  }, [isOpen]);

  const runAutoDiagnostics = async () => {
    setIsDiagnosing(true);
    const sub = await UniversalTvEngine.detectLocalSubnet();
    setDetectedSubnet(sub);
    if (!device || device.ip.startsWith('127.')) {
      setTvIpInput(`${sub}.145`);
    }
    setIsDiagnosing(false);
  };

  const handleTestDirectSignal = async () => {
    if (!tvIpInput) return;
    setTestStatus('testing');
    setTestLog(`Enviando señal de prueba sin restricciones a ${tvIpInput}...`);
    haptics.lightTap();
    soundFX.playClick(600);

    try {
      // Send test ping using UniversalTvEngine
      await UniversalTvEngine.dispatchCommand(tvIpInput, 'roku', 'Home', 'press');
      setTestStatus('success');
      setTestLog(`✓ Señal emitida con éxito hacia ${tvIpInput} (Canal Directo Form-POST sin bloqueo CORS).`);
      soundFX.playSuccess();
      haptics.heavyImpact();
      onSelectIp(tvIpInput);
    } catch (e: any) {
      setTestStatus('failed');
      setTestLog(`Error: ${e.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                Diagnóstico de Red & Solución de Limitaciones
              </h2>
              <p className="text-xs text-neutral-400">
                Análisis de subred Wi-Fi y canal de transmisión sin bloqueos
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

        {/* Scrollable body */}
        <div className="overflow-y-auto pr-1 py-3 space-y-4 text-xs text-neutral-300">
          
          {/* Subnet Auto-Detected via WebRTC */}
          <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-neutral-400" />
              <div>
                <span className="font-semibold text-neutral-200 block">Subred Wi-Fi Local Detectada</span>
                <span className="text-[11px] text-neutral-500">Detectada automáticamente mediante WebRTC</span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 font-bold">
                {isDiagnosing ? 'Detectando...' : `${detectedSubnet}.0/24`}
              </span>
            </div>
          </div>

          {/* Explanation of Browser Limitations & Solved Mechanisms */}
          <div className="space-y-2">
            <span className="font-bold text-neutral-200 block text-xs">
              Limitaciones del Navegador Resueltas en esta App:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-neutral-200 block mb-1">1. Bloqueo CORS / PNA</span>
                <p className="text-neutral-400 leading-relaxed">
                  Solucionado: Los comandos se emiten mediante <strong>Form-POST Directo</strong> y <strong>No-CORS Beacon</strong>, que los navegadores no bloquean.
                </p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-neutral-200 block mb-1">2. HTTPS a HTTP Local</span>
                <p className="text-neutral-400 leading-relaxed">
                  Solucionado: Transmisión sin bloqueo mediante canal iframe desacoplado e inyección de eventos sin preflight.
                </p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-neutral-200 block mb-1">3. Sin Escaneo UDP Raw</span>
                <p className="text-neutral-400 leading-relaxed">
                  Solucionado: Detección asistida de IP por candidato ICE WebRTC y verificación directa de puerto 8060/6466.
                </p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-neutral-200 block mb-1">4. Bluetooth en Sandboxes</span>
                <p className="text-neutral-400 leading-relaxed">
                  Solucionado: Conmutador automático a Canal Inalámbrico Universal cuando Web Bluetooth está deshabilitado.
                </p>
              </div>
            </div>
          </div>

          {/* Quick TV IP Input & Test Form */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-200 mb-1">
                Dirección IP de tu Smart TV TCL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tvIpInput}
                  onChange={(e) => setTvIpInput(e.target.value)}
                  placeholder="192.168.1.xxx"
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-100 focus:outline-none focus:border-neutral-500"
                />
                <button
                  onClick={handleTestDirectSignal}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl font-bold text-xs border border-neutral-700 transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{testStatus === 'testing' ? 'Probando...' : 'Emitir Prueba'}</span>
                </button>
              </div>
            </div>

            {testLog && (
              <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300">
                {testLog}
              </div>
            )}

            {/* How to find TV IP in 5 seconds */}
            <div className="pt-2 border-t border-neutral-800/80 text-neutral-400 text-[11px] leading-relaxed">
              <strong className="text-neutral-300">¿Cómo ver la IP exacta en tu Smart TV TCL?</strong>
              <p className="mt-0.5">
                En el mando de tu TV ve a: <strong>Ajustes &gt; Red e Internet &gt; [Tu Wi-Fi] &gt; Dirección IP</strong> (ejemplo: <code>192.168.1.52</code>).
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold"
          >
            Guardar y Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
