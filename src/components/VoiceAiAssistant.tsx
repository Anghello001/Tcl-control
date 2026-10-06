import React, { useState } from 'react';
import { TvDevice } from '../types.ts';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Zap, 
  Sliders, 
  Play, 
  CheckCircle2,
  Tv,
  AlertCircle
} from 'lucide-react';

interface VoiceAiAssistantProps {
  device: TvDevice | null;
  onSendCommand: (cmd: string) => void;
  onLaunchApp: (appId: string) => void;
}

export const VoiceAiAssistant: React.FC<VoiceAiAssistantProps> = ({
  device,
  onSendCommand,
  onLaunchApp,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; action?: string }>>([
    {
      role: 'assistant',
      text: '¡Hola! Soy tu asistente de IA para Smart TV TCL y Mando de Consola. Puedes pedirme comandos de voz (ej: "Activar modo juego", "Abrir GeForce NOW", "Subir volumen") o preguntarme cómo optimizar el televisor para videojuegos.',
    },
  ]);

  // Speech Recognition with resilient error handling (No window.alert)
  const toggleSpeech = () => {
    setSpeechError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechError('Tu navegador no tiene activado el reconocimiento de voz nativo. Por favor escribe tu comando en el campo de texto.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        haptics.lightTap();
        soundFX.playClick(800);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(transcript);
          handleSend(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech error:', e?.error);
        setIsListening(false);
        if (e?.error === 'not-allowed') {
          setSpeechError('Permiso de micrófono denegado. Puedes escribir tus comandos en el campo de texto.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
      setSpeechError('No se pudo iniciar el micrófono. Puedes escribir tu consulta abajo.');
    }
  };

  const handleSend = async (userPrompt?: string) => {
    const q = userPrompt || query;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user' as const, text: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    haptics.lightTap();
    soundFX.playClick(700);

    // Check direct command matches
    const lower = q.toLowerCase();
    if (lower.includes('subir volumen') || lower.includes('más volumen')) {
      onSendCommand('VolumeUp');
    } else if (lower.includes('bajar volumen') || lower.includes('menos volumen')) {
      onSendCommand('VolumeDown');
    } else if (lower.includes('silenciar') || lower.includes('mutear')) {
      onSendCommand('VolumeMute');
    } else if (lower.includes('game master') || lower.includes('modo juego')) {
      onSendCommand('ToggleGameMode');
    } else if (lower.includes('netflix')) {
      onLaunchApp('netflix');
    } else if (lower.includes('youtube')) {
      onLaunchApp('youtube');
    } else if (lower.includes('geforce')) {
      onLaunchApp('geforce-now');
    } else if (lower.includes('hdmi 1')) {
      onSendCommand('HDMI 1');
    } else if (lower.includes('hdmi 2')) {
      onSendCommand('HDMI 2');
    }

    try {
      const res = await fetch('/api/ai/game-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          mode: 'Gamepad & Smart TV',
          tvModel: device?.model || 'TCL C845 4K Mini-LED Google TV',
        }),
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.text || 'Comando procesado correctamente.',
        },
      ]);
      soundFX.playSuccess();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Comando enviado al televisor. Recuerda tener Game Master activado para máxima velocidad de respuesta.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-3 h-[600px] bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Asistente de Voz & IA TCL GamePulse</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h3>
            <p className="text-[11px] text-slate-400">Control por voz, optimización de lag y diagnóstico</p>
          </div>
        </div>

        <div className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-mono text-cyan-300 font-semibold border border-slate-700">
          Gemini AI
        </div>
      </div>

      {/* Inline speech error notice if any */}
      {speechError && (
        <div className="p-2.5 bg-amber-950/70 border-b border-amber-500/40 text-amber-300 text-xs flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button onClick={() => setSpeechError(null)} className="text-amber-400 hover:text-white text-xs font-mono ml-2">✕</button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md font-medium'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-inner'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-cyan-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Procesando comando y optimizaciones TCL...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto">
        {[
          '🎮 Activar Game Master 144Hz',
          '🔊 Subir volumen a 50%',
          '🚀 Abrir GeForce NOW',
          '⚡ ¿Cómo reducir el input lag?',
          '📺 Cambiar a HDMI 1',
        ].map((tag, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(tag);
              handleSend(tag);
            }}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 whitespace-nowrap transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Input Form with Voice Mic */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
        <button
          onClick={toggleSpeech}
          className={`p-3 rounded-2xl border transition-all ${
            isListening
              ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-cyan-400 hover:border-slate-700'
          }`}
          title="Hablar por micrófono"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe un comando de voz o pregunta...'}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />

        <button
          onClick={() => handleSend()}
          disabled={!query.trim() || loading}
          className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white rounded-2xl font-bold transition-all shadow-md active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
