import React, { useState } from 'react';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Smartphone, 
  X, 
  Check, 
  Copy, 
  Zap, 
  ShieldCheck, 
  Wifi, 
  Bluetooth, 
  Terminal, 
  CheckCircle2,
  FolderOpen,
  Play
} from 'lucide-react';

interface BitriseApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BitriseApkModal: React.FC<BitriseApkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'aide' | 'permissions' | 'bitrise'>('aide');

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
    soundFX.playClick(750);
    haptics.lightTap();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden text-zinc-100 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Compilar APK en tu Celular (AIDE / Android IDE)
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  Proyecto Listo
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Genera el instalador APK directamente desde tu teléfono Android
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

        {/* Tab Navigation */}
        <div className="flex gap-2 pt-3 pb-2 border-b border-zinc-800/60">
          <button
            onClick={() => setActiveTab('aide')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'aide'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📱 Guía AIDE (En tu Celular)
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'permissions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🛡️ Permisos & Conectividad
          </button>
          <button
            onClick={() => setActiveTab('bitrise')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'bitrise'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ☁️ Compilar en la nube (Bitrise)
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-3 space-y-3 overflow-y-auto max-h-[60vh] text-xs">
          
          {activeTab === 'aide' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Pasos para compilar en AIDE (en tu celular Android):
                </div>

                <div className="space-y-2.5 text-[11px] text-zinc-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Abre la aplicación <b>AIDE</b> en tu celular.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Selecciona <b>"Abrir Proyecto"</b> (Open Project) y navega a la carpeta <b>`/android`</b> de este proyecto (o a la carpeta raíz).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      AIDE reconocerá el archivo <b>`build.gradle`</b> y el código fuente en Java y los assets pre-empaquetados.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      Presiona el botón <b>▶ (Play / Run)</b> en la parte superior de AIDE. AIDE compilará el código y abrirá el instalador para instalar el APK en tu teléfono automáticamente.
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-bundled notice */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1.5">
                <div className="text-emerald-300 font-medium flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Assets pre-empaquetados incluidos:
                </div>
                <p className="text-[10px] text-zinc-300 leading-relaxed">
                  Todos los archivos web (HTML, CSS, JS e iconos) ya están empaquetados dentro de <b>`android/app/src/main/assets/public/`</b>. No necesitas instalar Node.js ni correr Vite en tu teléfono; AIDE compilará el APK de forma 100% offline.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Permisos configurados en AndroidManifest.xml:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-medium text-[11px]">
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Red Wi-Fi y Multicast</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono space-y-0.5">
                      <div>• INTERNET</div>
                      <div>• ACCESS_NETWORK_STATE</div>
                      <div>• ACCESS_WIFI_STATE</div>
                      <div>• CHANGE_WIFI_MULTICAST_STATE</div>
                    </div>
                  </div>

                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-medium text-[11px]">
                      <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Bluetooth y Mandos Físicos</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono space-y-0.5">
                      <div>• BLUETOOTH_CONNECT</div>
                      <div>• BLUETOOTH_SCAN</div>
                      <div>• BLUETOOTH_ADVERTISE</div>
                      <div>• ACCESS_FINE_LOCATION</div>
                    </div>
                  </div>

                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-medium text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hardware & Seguridad de Red</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono space-y-0.5">
                      <div>• VIBRATE (Hápticos del mando)</div>
                      <div>• WAKE_LOCK (Mantener pantalla activa durante juego)</div>
                      <div>• usesCleartextTraffic="true" (Conexión sin Mixed Content)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bitrise' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Archivo bitrise.yml listo</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Si alguna vez prefieres compilar en la nube, el archivo <b>`bitrise.yml`</b> sigue configurado en el proyecto.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="text-[10px] text-zinc-500 font-mono">
            Package: com.tclgamepulse.remote
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors shadow-md shadow-emerald-950/40"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
