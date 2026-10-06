import React, { useState, useEffect, useRef } from 'react';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { DirectTvBridge } from '../services/directTvBridge.ts';
import { 
  Tv, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Zap, 
  Info,
  Sliders,
  Terminal,
  Activity,
  Radio,
  Settings,
  ShieldCheck
} from 'lucide-react';

interface TclPairingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: TvDevice | null;
  onSyncPairing: (comboType: 'home_ok' | 'assistant_voice') => Promise<void>;
  onSendCommand: (cmd: string, type?: 'press' | 'down' | 'up') => void;
}

export const TclPairingAssistantModal: React.FC<TclPairingAssistantModalProps> = ({
  isOpen,
  onClose,
  device,
  onSyncPairing,
  onSendCommand,
}) => {
  const [heldButtons, setHeldButtons] = useState<{ home: boolean; ok: boolean }>({
    home: false,
    ok: false,
  });
  const [holdTimer, setHoldTimer] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'holding' | 'synced'>('idle');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tvType, setTvType] = useState<'google_tv' | 'roku_tv'>('google_tv');
  const [tvIpInput, setTvIpInput] = useState<string>(device?.ip || '192.168.1.145');

  const syncIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (device?.ip) {
      setTvIpInput(device.ip);
    }
  }, [device]);

  // Track simultaneous press of Inicio and OK
  useEffect(() => {
    const isBothHeld = heldButtons.home && heldButtons.ok;

    if (isBothHeld && syncStatus !== 'synced') {
      setSyncStatus('holding');
      haptics.lightTap();
      soundFX.playClick(700, 0.03);

      if (!syncIntervalRef.current) {
        let count = 0;
        syncIntervalRef.current = setInterval(() => {
          count += 100;
          setHoldTimer(count);
          haptics.lightTap();

          if (count >= 3000) {
            clearInterval(syncIntervalRef.current);
            syncIntervalRef.current = null;
            completeSync();
          }
        }, 100);
      }
    } else if (!isBothHeld && !isSending) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      if (syncStatus === 'holding') {
        setSyncStatus('idle');
        setHoldTimer(0);
      }
    }
  }, [heldButtons, syncStatus, isSending]);

  if (!isOpen) return null;

  const completeSync = async () => {
    setSyncStatus('synced');
    haptics.heavyImpact();
    soundFX.playSuccess();
    await transmitSyncSignal();
  };

  const transmitSyncSignal = async () => {
    setIsSending(true);
    haptics.mediumImpact();
    soundFX.playClick(600);

    const targetDev: TvDevice = device || {
      id: `tv-${tvIpInput}`,
      name: 'TCL Smart TV',
      model: 'TCL Smart TV',
      ip: tvIpInput,
      port: tvType === 'roku_tv' ? 8060 : 6466,
      protocol: tvType === 'roku_tv' ? 'roku' : 'android_tv',
      online: true,
      powerState: 'on',
      volume: 20,
      muted: false,
      currentApp: 'Home',
      inputSource: 'HDMI 1',
      gameMode: true,
      vrrEnabled: true,
      refreshRate: '120Hz',
      latencyMs: 5,
      lastSeen: Date.now(),
    };

    const res = await DirectTvBridge.sendPairingSync(targetDev, 'home_ok');
    setDispatchResult(res);
    setIsSending(false);
    await onSyncPairing('home_ok');
  };

  // Quick command test (e.g. Volume) to verify if the TV actually received it
  const handleQuickTest = async (cmd: string) => {
    onSendCommand(cmd, 'press');
    haptics.lightTap();
    soundFX.playClick(800);
    setDispatchResult({
      success: true,
      message: `Comando "${cmd}" transmitido a ${tvIpInput}. Comprueba si tu TV reaccionó.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Sincronización TCL (Inicio + OK)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Instrucciones reales según el modelo de tu televisor
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
        <div className="py-4 space-y-4 overflow-y-auto max-h-[72vh] text-xs">
          
          {/* Diagnostic Note */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-zinc-200 font-medium">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>¿Por qué la pantalla de la TV pide "Inicio + OK"?</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Ese mensaje en pantalla es para sincronizar el <b>mando de plástico original por radiofrecuencia/Bluetooth de fábrica</b>. Para controlar la TV desde esta Web App, se utiliza la <b>red Wi-Fi</b> (que no requiere el mando físico).
            </p>
          </div>

          {/* TV Model Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Selecciona el Sistema de tu TV TCL:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTvType('google_tv')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tvType === 'google_tv'
                    ? 'bg-zinc-900 border-cyan-500/80 text-zinc-100 shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-xs">TCL Google TV / Android</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Modelos C645, C745, C845, P635, P735...</div>
              </button>

              <button
                type="button"
                onClick={() => setTvType('roku_tv')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tvType === 'roku_tv'
                    ? 'bg-zinc-900 border-purple-500/80 text-zinc-100 shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-xs">TCL Roku TV</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Modelos con sistema operativo Roku OS</div>
              </button>
            </div>
          </div>

          {/* Model Specific Instructions */}
          {tvType === 'google_tv' ? (
            <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                <Settings className="w-3.5 h-3.5" />
                Pasos para TCL Google TV / Android TV:
              </div>
              <ol className="list-decimal list-inside text-[11px] text-zinc-300 space-y-1.5 pl-1 leading-relaxed">
                <li>En tu TV, ve a <b>Ajustes &gt; Sistema &gt; Información</b>.</li>
                <li>Pulsa <b>7 veces seguidas</b> en <b>Compilación del SO</b> para activar Opciones de Desarrollador.</li>
                <li>Ve a <b>Ajustes &gt; Sistema &gt; Opciones de Desarrollador</b> y activa <b>Depuración de red (ADB)</b>.</li>
                <li>Al enviar un comando desde esta web, aparecerá en tu TV un cuadro para <b>"Permitir siempre"</b>.</li>
              </ol>
            </div>
          ) : (
            <div className="p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-xs">
                <Settings className="w-3.5 h-3.5" />
                Pasos para TCL Roku TV:
              </div>
              <ol className="list-decimal list-inside text-[11px] text-zinc-300 space-y-1.5 pl-1 leading-relaxed">
                <li>En tu TV, ve a <b>Configuración &gt; Sistema &gt; Configuración avanzada del sistema</b>.</li>
                <li>Selecciona <b>Control mediante apps móviles</b>.</li>
                <li>Cambia <b>Acceso a la red</b> a <b>Habilitado</b> o <b>Permisivo</b>.</li>
                <li>¡Listo! Tu TV aceptará los comandos en milisegundos por el puerto 8060.</li>
              </ol>
            </div>
          )}

          {/* Target IP Input & Simultaneous Button Pad */}
          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-300">IP de tu TV en la red local:</span>
              <input
                type="text"
                value={tvIpInput}
                onChange={(e) => setTvIpInput(e.target.value)}
                placeholder="192.168.1.XXX"
                className="px-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-100 text-right w-36 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-[11px] text-zinc-400">
              Mantén presionados los dos botones a la vez durante 3 segundos:
            </div>

            {/* Simultaneous Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onMouseDown={() => setHeldButtons(prev => ({ ...prev, home: true }))}
                onMouseUp={() => setHeldButtons(prev => ({ ...prev, home: false }))}
                onTouchStart={() => setHeldButtons(prev => ({ ...prev, home: true }))}
                onTouchEnd={() => setHeldButtons(prev => ({ ...prev, home: false }))}
                className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold transition-all select-none ${
                  heldButtons.home 
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 scale-95 shadow-inner' 
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                }`}
              >
                <div className="text-base">🏠</div>
                <span>INICIO (HOME)</span>
                <span className="text-[9px] opacity-75">{heldButtons.home ? 'PULSADO' : 'MANTENER'}</span>
              </button>

              <button
                type="button"
                onMouseDown={() => setHeldButtons(prev => ({ ...prev, ok: true }))}
                onMouseUp={() => setHeldButtons(prev => ({ ...prev, ok: false }))}
                onTouchStart={() => setHeldButtons(prev => ({ ...prev, ok: true }))}
                onTouchEnd={() => setHeldButtons(prev => ({ ...prev, ok: false }))}
                className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold transition-all select-none ${
                  heldButtons.ok 
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 scale-95 shadow-inner' 
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                }`}
              >
                <div className="text-base">⭕</div>
                <span>OK (SELECT)</span>
                <span className="text-[9px] opacity-75">{heldButtons.ok ? 'PULSADO' : 'MANTENER'}</span>
              </button>
            </div>

            {/* Progress Bar */}
            {syncStatus === 'holding' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Transmitiendo señal continua...</span>
                  <span className="font-mono font-bold text-amber-400">{(holdTimer / 1000).toFixed(1)}s / 3.0s</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-100"
                    style={{ width: `${Math.min(100, (holdTimer / 3000) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Direct Send Button */}
            <button
              type="button"
              onClick={transmitSyncSignal}
              disabled={isSending}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 text-zinc-100 font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {isSending ? 'Transmitiendo a la TV...' : 'Enviar Señal Inicio + OK Directa'}
            </button>
          </div>

          {/* Quick Hardware Confirmation Test */}
          <div className="p-3 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-2">
            <span className="text-[11px] font-medium text-zinc-400">Prueba rápida de respuesta del televisor:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickTest('VolumeUp')}
                className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-medium"
              >
                Volumen +
              </button>
              <button
                type="button"
                onClick={() => handleQuickTest('VolumeDown')}
                className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-medium"
              >
                Volumen -
              </button>
              <button
                type="button"
                onClick={() => handleQuickTest('Home')}
                className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-medium"
              >
                Menú Inicio
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {dispatchResult && (
            <div className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
              dispatchResult.success 
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                : 'bg-red-950/20 border-red-500/40 text-red-300'
            }`}>
              {dispatchResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              )}
              <span className="leading-relaxed">{dispatchResult.message}</span>
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
