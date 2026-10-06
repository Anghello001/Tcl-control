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
  Terminal,
  Settings,
  HelpCircle,
  Copy,
  Check
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
  const [tvIpInput, setTvIpInput] = useState<string>(device?.ip || '192.168.1.145');
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeResults, setProbeResults] = useState<any[]>([]);
  const [probeSummary, setProbeSummary] = useState<string>('');
  const [copiedBridgeCmd, setCopiedBridgeCmd] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      UniversalTvEngine.detectLocalSubnet().then(sub => {
        setDetectedSubnet(sub);
        if (!device || device.ip.startsWith('127.')) {
          setTvIpInput(`${sub}.145`);
        }
      });
    }
  }, [isOpen, device]);

  if (!isOpen) return null;

  const handleProbeTvPorts = async () => {
    if (!tvIpInput) return;
    setIsProbing(true);
    setProbeSummary('');
    setProbeResults([]);
    haptics.lightTap();
    soundFX.playClick(600);

    try {
      const res = await fetch('/api/tv/probe-ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: tvIpInput }),
      });

      const data = await res.json();
      if (data.results) {
        setProbeResults(data.results);
        setProbeSummary(data.message);
        if (data.openCount > 0) {
          soundFX.playSuccess();
          haptics.heavyImpact();
        }
      }
    } catch (err: any) {
      setProbeSummary(`Error al escanear puertos: ${err.message}`);
    } finally {
      setIsProbing(false);
    }
  };

  const copyLocalBridge = () => {
    navigator.clipboard.writeText('npm run dev');
    setCopiedBridgeCmd(true);
    soundFX.playClick(800);
    setTimeout(() => setCopiedBridgeCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[88vh] bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Diagnóstico de Red & Solución de Limitaciones
              </h2>
              <p className="text-[11px] text-zinc-400">
                Verificación real de puertos y conectividad de tu TV TCL
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
          
          {/* IP Test Box */}
          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-300">IP del Smart TV a diagnosticar:</span>
              <span className="text-[10px] text-zinc-400 font-mono">Subred detectada: {detectedSubnet}.x</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tvIpInput}
                onChange={(e) => setTvIpInput(e.target.value)}
                placeholder="192.168.1.XXX"
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleProbeTvPorts}
                disabled={isProbing || !tvIpInput}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-medium rounded-xl flex items-center gap-1.5 transition-all text-xs"
              >
                <Search className="w-3.5 h-3.5" />
                {isProbing ? 'Analizando...' : 'Testear Puertos'}
              </button>
            </div>

            {/* Probe Results Table */}
            {probeResults.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <div className="text-[11px] font-medium text-zinc-300">Resultados del escaneo de puertos:</div>
                <div className="space-y-1">
                  {probeResults.map((r, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
                        r.open 
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {r.open ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-zinc-700 shrink-0 ml-0.5" />
                        )}
                        <span className="font-medium text-zinc-200">{r.service}</span>
                        <span className="text-[10px] font-mono text-zinc-500">(Puerto {r.port})</span>
                      </div>
                      <span className={`text-[10px] font-medium ${r.open ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {r.open ? 'ABIERTO / LISTO' : 'Cerrado / Inaccesible'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {probeSummary && (
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 leading-relaxed">
                {probeSummary}
              </div>
            )}
          </div>

          {/* Explanation of Web Limitations & Real Solutions */}
          <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              ¿Por qué fallan las apps web alojadas en la nube (Vercel / Render)?
            </div>
            
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Cuando una web está en la nube por <b>HTTPS</b>, los navegadores bloquean las conexiones a IPs de tu casa (<b>Mixed Content Security</b>). Además, los servidores en la nube de Vercel/Render no están dentro de tu router Wi-Fi doméstico.
            </p>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Solución 100% Garantizada: Ejecución Local
              </div>
              <p className="text-[10px] text-zinc-400">
                Al ejecutar esta aplicación en tu propia máquina (PC o laptop en la misma red Wi-Fi), el servidor se comunica directamente por sockets TCP con el televisor con 0 ms de latencia:
              </p>
              <div className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-xs text-cyan-300">
                <span>npm run dev</span>
                <button
                  type="button"
                  onClick={copyLocalBridge}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {copiedBridgeCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
