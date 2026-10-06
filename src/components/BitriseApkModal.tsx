import React, { useState } from 'react';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Smartphone, 
  X, 
  Check, 
  Copy, 
  Zap, 
  Download, 
  ShieldCheck, 
  Wifi, 
  Bluetooth, 
  Terminal, 
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface BitriseApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BitriseApkModal: React.FC<BitriseApkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedYml, setCopiedYml] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflow' | 'permissions' | 'instructions'>('workflow');

  if (!isOpen) return null;

  const bitriseYmlCode = `format_version: '11'
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
project_type: android

workflows:
  primary:
    summary: Generación automática de APK Android para TCL GamePulse
    steps:
    - activate-ssh-key@4: {}
    - git-clone-repo@1: {}
    - npm@1:
        inputs:
          command: install
    - script@1:
        title: Compilar WebApp y Sincronizar Capacitor
        inputs:
          content: |
            npm run build
            npx cap sync android
    - android-build@1:
        title: Compilar APK Android
        inputs:
          project_location: android
          module: app
          variant: debug
          build_type: apk
    - deploy-to-bitrise-io@2:
        title: Publicar APK Descargable (.apk)`;

  const copyToClipboard = (text: string, isYml: boolean) => {
    navigator.clipboard.writeText(text);
    if (isYml) {
      setCopiedYml(true);
      setTimeout(() => setCopiedYml(false), 2000);
    } else {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
    soundFX.playClick(750);
    haptics.lightTap();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden text-zinc-100 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Generador de APK Android (Bitrise CI/CD)
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                  bitrise.yml listo
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Compilación nativa con permisos desbloqueados de red local y Bluetooth
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
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'workflow'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pipeline Bitrise (.yml)
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'permissions'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Permisos Android & Conectividad
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'instructions'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Guía de Compilación en Bitrise
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-3 space-y-3 overflow-y-auto max-h-[60vh] text-xs">
          
          {activeTab === 'workflow' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>Configuración bitrise.yml integrada en el proyecto</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bitriseYmlCode, true)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[10px] font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedYml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedYml ? 'Copiado' : 'Copiar YML'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Bitrise detecta automáticamente este archivo al vincular tu repositorio de GitHub y genera el instalador <b>.apk</b> listo para descargar en tu teléfono móvil.
                </p>
                <pre className="p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-lg text-[10px] font-mono text-zinc-300 overflow-x-auto">
                  {bitriseYmlCode}
                </pre>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1.5">
                <div className="text-emerald-300 font-medium flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ventajas del APK compilado con Bitrise:
                </div>
                <ul className="list-disc list-inside text-[10px] text-zinc-300 space-y-1 pl-1">
                  <li><b>Sin bloqueo CORS ni Mixed Content</b>: El APK se ejecuta en `http://localhost` nativo con `usesCleartextTraffic="true"`.</li>
                  <li><b>Envío directo por socket local</b> al puerto 8060 (Roku) y 5555 (Android ADB) de tu TV TCL.</li>
                  <li><b>Vibración y hápticos nativos</b> sin retrasos de navegador web.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Permisos incluidos en AndroidManifest.xml:
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
                      <div>• usesCleartextTraffic="true" (Comunicación directa con TVs)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-zinc-200">
                  Pasos para generar tu APK en Bitrise:
                </div>

                <div className="space-y-2.5 text-[11px] text-zinc-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <b>Sube este repositorio a GitHub</b> (o conéctalo a tu cuenta).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Entra en <b>app.bitrise.io</b> y haz clic en <b>"Add New App"</b> &gt; selecciona tu repositorio.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Bitrise detectará el archivo <b>bitrise.yml</b> y el proyecto Android con Capacitor automáticamente.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      Haz clic en <b>"Start Build"</b>. En ~2 minutos, Bitrise compilará el APK. Ve a la pestaña <b>"Artifacts"</b> y descarga <b>app-debug.apk</b> directamente en tu móvil.
                    </div>
                  </div>
                </div>
              </div>

              {/* Local Build Command */}
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-zinc-300">
                  <span>¿Quieres compilar el APK en tu propia PC con Android Studio?</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npx cap open android', false)}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono text-cyan-300">
                  npm run build && npx cap sync android && npx cap open android
                </pre>
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
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition-colors shadow-md shadow-purple-950/40"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
