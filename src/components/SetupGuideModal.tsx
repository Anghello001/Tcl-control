import React from 'react';
import { 
  BookOpen, 
  X, 
  Gamepad2, 
  Wifi, 
  Zap, 
  Tv, 
  Sliders, 
  CheckCircle2, 
  HelpCircle,
  Sparkles,
  Smartphone,
  Cpu
} from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Guía de Configuración: Mando de Consola para Smart TV TCL
              </h2>
              <p className="text-xs text-slate-400">
                Aprende cómo funciona la detección Wi-Fi y cómo tu TV lo reconoce como mando
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-2 py-4 space-y-6 text-slate-300 text-xs sm:text-sm">
          
          {/* Section 1: ¿Cómo funciona la detección por Wi-Fi? */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-cyan-400 flex items-center gap-2 mb-2">
              <Wifi className="w-5 h-5 text-cyan-400" />
              1. ¿Cómo se conecta y detecta tu Smart TV TCL en la red Wi-Fi?
            </h3>
            <p className="text-slate-300 mb-2 leading-relaxed">
              Los televisores TCL se comunican en la red local mediante protocolos estándar según su sistema operativo:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400">
              <li>
                <strong className="text-slate-200">TCL Google TV / Android TV:</strong> Utiliza el protocolo <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">Android TV Remote Service</code> en los puertos <strong>6466/6467</strong> y <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">ADB (Android Debug Bridge)</code> en el puerto <strong>5555</strong>.
              </li>
              <li>
                <strong className="text-slate-200">TCL Roku TV:</strong> Utiliza el protocolo <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">Roku ECP (External Control Protocol)</code> sobre HTTP en el puerto <strong>8060</strong>, permitiendo descubrir el TV por SSDP y enviar comandos instantáneos.
              </li>
              <li>
                <strong className="text-slate-200">Requisito clave:</strong> Tu móvil/ordenador y tu Smart TV TCL deben estar conectados a la <strong>misma red Wi-Fi</strong> (preferiblemente 5 GHz).
              </li>
            </ul>
          </div>

          {/* Section 2: ¿Cómo se detecta como un Mando de Consola? */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-amber-400 flex items-center gap-2 mb-2">
              <Gamepad2 className="w-5 h-5 text-amber-400" />
              2. ¿Cómo lo detecta el televisor como un mando de consola de videojuegos?
            </h3>
            <p className="text-slate-300 mb-2 leading-relaxed">
              Esta aplicación web traduce las pulsaciones táctiles, joysticks virtuales y gatillos a los códigos de entrada nativos de mandos de consola (Gamepad HID y Keycodes de Android/Roku):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">🎮 Botones de Consola:</span>
                <div>&bull; Botón A / Cruz ➔ KEYCODE_BUTTON_A (96)</div>
                <div>&bull; Botón B / Círculo ➔ KEYCODE_BUTTON_B (97)</div>
                <div>&bull; Botón X / Cuadrado ➔ KEYCODE_BUTTON_X (99)</div>
                <div>&bull; Botón Y / Triángulo ➔ KEYCODE_BUTTON_Y (100)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">🕹️ Gatillos & Sticks Analógicos:</span>
                <div>&bull; L1 / R1 ➔ KEYCODE_BUTTON_L1 / R1</div>
                <div>&bull; L2 / R2 ➔ Ejes Analógicos de Gatillo</div>
                <div>&bull; Stick Izquierdo ➔ AXIS_X / AXIS_Y</div>
                <div>&bull; Stick Derecho ➔ AXIS_Z / AXIS_RZ</div>
              </div>
            </div>
          </div>

          {/* Section 3: Activar TCL Game Master & 144Hz VRR */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              3. Configurar TCL Game Master (144Hz VRR & Reducción de Latencia a 5ms)
            </h3>
            <p className="text-slate-300 mb-2 leading-relaxed">
              Para obtener la experiencia de juego más fluida y sin retraso en tu Smart TV TCL:
            </p>
            <ol className="space-y-1.5 list-decimal list-inside text-slate-400">
              <li>En el mando o menú del TV, pulsa <strong className="text-slate-200">Ajustes &gt; Pantalla y Sonido &gt; Juego</strong>.</li>
              <li>Activa la casilla <strong className="text-slate-200">"Game Master"</strong> o <strong className="text-slate-200">"Modo Juego"</strong>.</li>
              <li>Habilita <strong className="text-slate-200">ALLM (Modo Automático de Baja Latencia)</strong> y <strong className="text-slate-200">VRR (Frecuencia de Actualización Variable hasta 144Hz)</strong>.</li>
              <li>Esto desactiva los filtros de procesamiento de imagen pesados, reduciendo la latencia de 80ms a menos de <strong>6ms</strong>.</li>
            </ol>
          </div>

          {/* Section 4: Passthrough de Mandos Físicos USB / Bluetooth */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-purple-400 flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              4. Conexión de Mandos Físicos (PlayStation 5, Xbox, Nintendo Switch)
            </h3>
            <p className="text-slate-300 mb-2 leading-relaxed">
              Puedes conectar un mando de PS4/PS5, Xbox One/Series o Nintendo Switch por Bluetooth a tu teléfono o PC, y esta WebApp lo detectará con la <strong>Web Gamepad API</strong>, transmitiendo automáticamente todos los botones físicos a tu Smart TV TCL sin cables.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            ¡Entendido, ir al Mando!
          </button>
        </div>

      </div>
    </div>
  );
};
