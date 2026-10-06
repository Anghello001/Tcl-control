import React, { useState, useEffect, useRef } from 'react';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Tv, 
  Home, 
  CheckCircle2, 
  Radio, 
  Mic, 
  Bot, 
  X, 
  Zap, 
  Info,
  ExternalLink,
  Smartphone,
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
  const [heldButtons, setHeldButtons] = useState<{ home: boolean; ok: boolean; assistant: boolean; voice: boolean }>({
    home: false,
    ok: false,
    assistant: false,
    voice: false,
  });

  const [holdTimer, setHoldTimer] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'holding' | 'synced'>('idle');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const syncIntervalRef = useRef<any>(null);

  // Simultaneous touch tracking
  useEffect(() => {
    const isBothHeld = (activeStep === 1 && heldButtons.home && heldButtons.ok) ||
                       (activeStep === 2 && heldButtons.assistant && heldButtons.voice);

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
            completeSyncStep();
          }
        }, 100);
      }
    } else if (!isBothHeld && !isAutoSyncing) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      if (syncStatus === 'holding') {
        setSyncStatus('idle');
        setHoldTimer(0);
      }
    }
  }, [heldButtons, activeStep, syncStatus, isAutoSyncing]);

  const completeSyncStep = async () => {
    setSyncStatus('synced');
    haptics.heavyImpact();
    soundFX.playSuccess();

    if (activeStep === 1) {
      await onSyncPairing('home_ok');
      setFeedbackMessage('✓ Emparejamiento INICIO + OK completado con éxito.');
    } else {
      await onSyncPairing('assistant_voice');
      setFeedbackMessage('✓ Búsqueda por voz activada y sensibilidad calibrada al máximo.');
    }
  };

  const handleAutoSync = async (type: 'home_ok' | 'assistant_voice') => {
    setIsAutoSyncing(true);
    setSyncStatus('holding');
    setHoldTimer(0);
    haptics.heavyImpact();
    soundFX.playClick(600);

    if (type === 'home_ok') {
      onSendCommand('Home', 'down');
      onSendCommand('Select', 'down');
    } else {
      onSendCommand('Assistant', 'down');
      onSendCommand('Voice', 'down');
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 100;
      setHoldTimer(progress);
      haptics.lightTap();

      if (progress >= 3000) {
        clearInterval(interval);
        if (type === 'home_ok') {
          onSendCommand('Home', 'up');
          onSendCommand('Select', 'up');
        } else {
          onSendCommand('Assistant', 'up');
          onSendCommand('Voice', 'up');
        }
        setIsAutoSyncing(false);
        completeSyncStep();
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-100">
              Sincronización de Control TCL
            </h2>
            <p className="text-xs text-neutral-400">
              Emparejamiento de red a ~1 metro de la TV
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Studio & Local Wi-Fi clarification box */}
        <div className="my-3 p-3 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs text-neutral-300">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-neutral-200">¿Cómo sincronizar con tu TV real?</strong>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Para enviar comandos a tu TV física, abre esta misma web desde el navegador de tu móvil conectado a la <strong>misma red Wi-Fi</strong> de tu televisor.
              </p>
            </div>
          </div>
        </div>

        {/* Step Selector */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => {
              setActiveStep(1);
              setSyncStatus('idle');
              setHoldTimer(0);
              haptics.lightTap();
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
              activeStep === 1
                ? 'bg-neutral-800 border-neutral-600 text-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}
          >
            1. Inicio + OK (3s)
          </button>

          <button
            onClick={() => {
              setActiveStep(2);
              setSyncStatus('idle');
              setHoldTimer(0);
              haptics.lightTap();
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
              activeStep === 2
                ? 'bg-neutral-800 border-neutral-600 text-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}
          >
            2. Asistente + Voz
          </button>
        </div>

        {/* Main Hold Area */}
        <div className="flex flex-col items-center gap-4 py-2">
          
          {/* Progress bar */}
          <div className="w-full">
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>{syncStatus === 'holding' ? 'Manteniendo señal...' : syncStatus === 'synced' ? '¡Completado!' : 'Mantén pulsados ambos botones:'}</span>
              <span className="font-mono text-neutral-200">{(holdTimer / 1000).toFixed(1)}s / 3.0s</span>
            </div>
            <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-neutral-300 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, (holdTimer / 3000) * 100)}%` }}
              />
            </div>
          </div>

          {/* STEP 1: INICIO + OK */}
          {activeStep === 1 && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-6 w-full py-2">
                {/* INICIO */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    setHeldButtons(prev => ({ ...prev, home: true }));
                    onSendCommand('Home', 'down');
                    haptics.lightTap();
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    setHeldButtons(prev => ({ ...prev, home: false }));
                    onSendCommand('Home', 'up');
                  }}
                  onPointerCancel={() => {
                    setHeldButtons(prev => ({ ...prev, home: false }));
                    onSendCommand('Home', 'up');
                  }}
                  className={`w-28 h-28 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all touch-none ${
                    heldButtons.home ? 'bg-neutral-200 text-neutral-950 border-white' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <Home className="w-6 h-6" />
                  <span className="font-bold text-xs">INICIO</span>
                </button>

                <span className="text-xl font-bold text-neutral-500 font-mono">+</span>

                {/* OK */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    setHeldButtons(prev => ({ ...prev, ok: true }));
                    onSendCommand('Select', 'down');
                    haptics.lightTap();
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    setHeldButtons(prev => ({ ...prev, ok: false }));
                    onSendCommand('Select', 'up');
                  }}
                  onPointerCancel={() => {
                    setHeldButtons(prev => ({ ...prev, ok: false }));
                    onSendCommand('Select', 'up');
                  }}
                  className={`w-28 h-28 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all touch-none ${
                    heldButtons.ok ? 'bg-neutral-200 text-neutral-950 border-white' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <span className="font-bold text-lg font-mono">OK</span>
                  <span className="font-bold text-xs">ACEPTAR</span>
                </button>
              </div>

              {/* Automated Sync Trigger */}
              <button
                onClick={() => handleAutoSync('home_ok')}
                disabled={isAutoSyncing}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-2xl font-bold text-xs border border-neutral-700 transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isAutoSyncing ? 'Sincronizando señal (3s)...' : 'Sincronizar Automáticamente (Inicio + OK)'}</span>
              </button>
            </div>
          )}

          {/* STEP 2: ASISTENTE + VOZ */}
          {activeStep === 2 && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-6 w-full py-2">
                {/* ASISTENTE */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    setHeldButtons(prev => ({ ...prev, assistant: true }));
                    onSendCommand('Assistant', 'down');
                    haptics.lightTap();
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    setHeldButtons(prev => ({ ...prev, assistant: false }));
                    onSendCommand('Assistant', 'up');
                  }}
                  onPointerCancel={() => {
                    setHeldButtons(prev => ({ ...prev, assistant: false }));
                    onSendCommand('Assistant', 'up');
                  }}
                  className={`w-28 h-28 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all touch-none ${
                    heldButtons.assistant ? 'bg-neutral-200 text-neutral-950 border-white' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <Bot className="w-6 h-6" />
                  <span className="font-bold text-xs">ASISTENTE</span>
                </button>

                <span className="text-xl font-bold text-neutral-500 font-mono">+</span>

                {/* VOZ */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    setHeldButtons(prev => ({ ...prev, voice: true }));
                    onSendCommand('Voice', 'down');
                    haptics.lightTap();
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    setHeldButtons(prev => ({ ...prev, voice: false }));
                    onSendCommand('Voice', 'up');
                  }}
                  onPointerCancel={() => {
                    setHeldButtons(prev => ({ ...prev, voice: false }));
                    onSendCommand('Voice', 'up');
                  }}
                  className={`w-28 h-28 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all touch-none ${
                    heldButtons.voice ? 'bg-neutral-200 text-neutral-950 border-white' : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <Mic className="w-6 h-6" />
                  <span className="font-bold text-xs">VOZ / MIC</span>
                </button>
              </div>

              <button
                onClick={() => handleAutoSync('assistant_voice')}
                disabled={isAutoSyncing}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-2xl font-bold text-xs border border-neutral-700 transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isAutoSyncing ? 'Calibrando sensibilidad (3s)...' : 'Calibrar Sensibilidad y Voz (3s)'}</span>
              </button>
            </div>
          )}

          {/* Feedback message */}
          {feedbackMessage && (
            <div className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

        </div>

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
