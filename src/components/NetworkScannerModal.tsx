import React, { useState } from 'react';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { LanScannerService, ScanProgress } from '../services/lanScanner.ts';
import { 
  Wifi, 
  Search, 
  Tv, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Zap, 
  Sliders,
  ShieldCheck,
  Radio,
  Activity,
  KeyRound,
  Signal
} from 'lucide-react';

interface NetworkScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDevice: (dev: TvDevice) => void;
  currentDevice: TvDevice | null;
  devices: TvDevice[];
  onScan: (subnet?: string, ip?: string) => Promise<void>;
  isScanning: boolean;
  onManualConnect: (ip: string, port: number, protocol: string, name: string) => Promise<void>;
}

export const NetworkScannerModal: React.FC<NetworkScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectDevice,
  currentDevice,
  devices,
  onScan,
  isScanning,
  onManualConnect,
}) => {
  const [manualIp, setManualIp] = useState('192.168.1.145');
  const [manualPort, setManualPort] = useState('6466');
  const [manualProtocol, setManualProtocol] = useState<'android_tv' | 'roku' | 'tcl_tcast'>('android_tv');
  const [manualName, setManualName] = useState('TCL Smart TV');
  const [selectedSubnet, setSelectedSubnet] = useState('192.168.1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<'auto' | 'manual' | 'test'>('auto');
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'failed'; message: string; ms?: number }>({
    status: 'idle',
    message: '',
  });

  if (!isOpen) return null;

  // Deep client-side direct Wi-Fi scan
  const handleDeepScan = async () => {
    setIsDeepScanning(true);
    haptics.mediumImpact();
    soundFX.playClick(700);

    try {
      // 1. Run server-side scan
      await onScan(selectedSubnet);

      // 2. Run client-side LAN probe
      await LanScannerService.scanSubnet(selectedSubnet, (prog) => {
        setScanProgress(prog);
      });

      soundFX.playSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeepScanning(false);
      setScanProgress(null);
    }
  };

  // Instant direct IP ping & diagnostic test
  const handleQuickTestIp = async () => {
    if (!manualIp) return;
    setTestResult({ status: 'testing', message: `Probando comunicación con ${manualIp}...` });
    haptics.lightTap();
    soundFX.playClick(600);

    const startTime = performance.now();
    try {
      // Direct client test
      const directDev = await LanScannerService.probeDirectIp(manualIp, 1000);
      const elapsed = Math.round(performance.now() - startTime);

      if (directDev) {
        setTestResult({
          status: 'success',
          message: `¡TV TCL Encontrado! Protocolo: ${directDev.protocol.toUpperCase()} &bull; Modelo: ${directDev.model}`,
          ms: elapsed,
        });
        soundFX.playSuccess();
        onSelectDevice(directDev);
      } else {
        // Test via server probe
        await onScan(undefined, manualIp);
        setTestResult({
          status: 'success',
          message: `Conexión establecida con ${manualIp} (Puerto ${manualPort})`,
          ms: elapsed,
        });
        soundFX.playSuccess();
      }
    } catch {
      setTestResult({
        status: 'failed',
        message: `No se pudo conectar a ${manualIp}. Verifica que el TV esté encendido y en la misma red Wi-Fi.`,
      });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp) return;

    setIsSubmitting(true);
    haptics.mediumImpact();
    soundFX.playClick();

    try {
      await onManualConnect(
        manualIp,
        parseInt(manualPort) || 6466,
        manualProtocol,
        manualName
      );
      soundFX.playSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Detección de Smart TV TCL</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950 border border-cyan-500/50 text-cyan-300 rounded-full font-bold">
                  Wi-Fi LAN
                </span>
              </h2>
              <p className="text-xs text-slate-400">Escaneo de subred local y emparejamiento con el televisor</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switchers */}
        <div className="flex rounded-xl bg-slate-950 p-1 mb-4 border border-slate-800 shrink-0">
          <button
            onClick={() => setTab('auto')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'auto'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Escaneo Automático</span>
          </button>

          <button
            onClick={() => setTab('manual')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'manual'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>IP Manual</span>
          </button>

          <button
            onClick={() => setTab('test')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'test'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Test de Ping</span>
          </button>
        </div>

        {/* TAB 1: Auto Scan & Subnet Selector */}
        {tab === 'auto' && (
          <div className="overflow-y-auto pr-1 space-y-3">
            {/* Subnet Selector Bar */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-300">Subred Wi-Fi:</span>
                <select
                  value={selectedSubnet}
                  onChange={(e) => setSelectedSubnet(e.target.value)}
                  className="bg-slate-900 text-xs text-cyan-300 font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400"
                >
                  {LanScannerService.commonSubnets.map(sub => (
                    <option key={sub} value={sub}>{sub}.0/24</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDeepScan}
                disabled={isScanning || isDeepScanning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning || isDeepScanning ? 'animate-spin' : ''}`} />
                <span>{isDeepScanning ? 'Escaneando...' : 'Escanear'}</span>
              </button>
            </div>

            {/* Deep Scan Progress Bar */}
            {isDeepScanning && scanProgress && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-cyan-500/40 animate-pulse">
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-mono">
                  <span>Sondeando subred {scanProgress.currentSubnet}.x...</span>
                  <span className="text-cyan-400 font-bold">{scanProgress.percent}% ({scanProgress.scanned}/{scanProgress.total})</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-150"
                    style={{ width: `${scanProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Discovered TV Devices List */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-300 block">
                Televisores TCL disponibles ({devices.length}):
              </span>

              {devices.map(dev => {
                const isSelected = currentDevice?.id === dev.id;

                return (
                  <div
                    key={dev.id}
                    onClick={() => {
                      haptics.mediumImpact();
                      soundFX.playSuccess();
                      onSelectDevice(dev);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-cyan-400'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-red-500 shadow-inner">
                        <Tv className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          {dev.name}
                          {dev.gameMode && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold">
                              144Hz ALLM
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          IP: <span className="text-cyan-300">{dev.ip}</span> &bull; Puerto: {dev.port} &bull; {dev.protocol.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right font-mono">
                        <div className="flex items-center justify-end gap-1 text-emerald-400 font-bold text-xs">
                          <Signal className="w-3 h-3" />
                          <span>{dev.latencyMs} ms</span>
                        </div>
                        <span className="text-[9px] text-slate-500">Wi-Fi 5GHz</span>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <button className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 rounded-xl text-xs font-bold transition-all">
                          Conectar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Manual IP Connect */}
        {tab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3 overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Descriptivo del TV</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Ej: TCL 65 C845 Salón"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Dirección IP</label>
                <input
                  type="text"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  placeholder="192.168.1.xxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Puerto</label>
                <input
                  type="number"
                  value={manualPort}
                  onChange={(e) => setManualPort(e.target.value)}
                  placeholder="6466 o 8060"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sistema Operativo de tu TCL</label>
              <select
                value={manualProtocol}
                onChange={(e) => {
                  const prot = e.target.value as any;
                  setManualProtocol(prot);
                  setManualPort(prot === 'roku' ? '8060' : '6466');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
              >
                <option value="android_tv">TCL Google TV / Android TV (Puerto 6466 / 5555)</option>
                <option value="roku">TCL Roku TV ECP (Puerto 8060)</option>
                <option value="tcl_tcast">TCL MagiConnect / T-Cast (Puerto 7983)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>{isSubmitting ? 'Vinculando Mando...' : 'Conectar y Guardar TV'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: Test de Ping & Diagnóstico */}
        {tab === 'test' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Probar IP directa del televisor TCL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  placeholder="192.168.1.xxx"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  onClick={handleQuickTestIp}
                  disabled={testResult.status === 'testing'}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Activity className="w-4 h-4" />
                  <span>{testResult.status === 'testing' ? 'Probando...' : 'Test Ping'}</span>
                </button>
              </div>
            </div>

            {/* Test Results Card */}
            {testResult.status !== 'idle' && (
              <div
                className={`p-4 rounded-2xl border-2 transition-all ${
                  testResult.status === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                    : testResult.status === 'failed'
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                    : 'bg-slate-950 border-cyan-500/50 text-cyan-300 animate-pulse'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  {testResult.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {testResult.status === 'failed' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                  {testResult.status === 'testing' && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
                  <span>
                    {testResult.status === 'success' ? 'Comunicación Exitosa' : testResult.status === 'failed' ? 'Sin Respuesta' : 'Comprobando...'}
                  </span>
                  {testResult.ms && (
                    <span className="font-mono text-[10px] ml-auto px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                      Latencia: {testResult.ms} ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed" dangerouslySetInnerHTML={{ __html: testResult.message }} />
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Conexión local protegida por Wi-Fi
          </span>
          <span className="font-mono text-cyan-400 font-semibold">{devices.length} TVs en lista</span>
        </div>

      </div>
    </div>
  );
};
