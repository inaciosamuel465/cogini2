import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Languages, ArrowRightLeft, Settings2, Globe, Sparkles, History as HistoryIcon, Download, X, FileText, Code } from 'lucide-react';
import { base64ToArrayBuffer, float32ToInt16, pcmToAudioBuffer, arrayBufferToBase64Safe as arrayBufferToBase64 } from '../services/audioUtils';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { saveAIMemory, getAIContextForUser } from '../services/aiMemoryService';

interface Props {
  onClose: () => void;
}

type Language = { code: string; name: string; label: string };

type TranslationItem = {
  id: string;
  timestamp: Date;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
};

const LANGUAGES: Language[] = [
  { code: 'pt-BR', name: 'Portuguese (Brazil)', label: 'Português' },
  { code: 'en-US', name: 'English', label: 'Inglês' },
  { code: 'es-ES', name: 'Spanish', label: 'Espanhol' },
  { code: 'fr-FR', name: 'French', label: 'Francês' },
  { code: 'de-DE', name: 'German', label: 'Alemão' },
  { code: 'it-IT', name: 'Italian', label: 'Italiano' },
  { code: 'ja-JP', name: 'Japanese', label: 'Japonês' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)', label: 'Chinês' },
  { code: 'ru-RU', name: 'Russian', label: 'Russo' },
  { code: 'ko-KR', name: 'Korean', label: 'Coreano' },
];

const LiveTranslation: React.FC<Props> = ({ onClose }) => {
  const { settings } = useSettings();
  const { user } = useAuth();
  
  // --- PERSISTENT SETTINGS ---
  const [sourceLang, setSourceLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sjl_trans_source');
      return saved ? JSON.parse(saved) : LANGUAGES[0];
    }
    return LANGUAGES[0];
  });

  const [targetLang, setTargetLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sjl_trans_target');
      return saved ? JSON.parse(saved) : LANGUAGES[1];
    }
    return LANGUAGES[1];
  });

  const [autoDetect, setAutoDetect] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sjl_trans_auto');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Save settings on change
  useEffect(() => { localStorage.setItem('sjl_trans_source', JSON.stringify(sourceLang)); }, [sourceLang]);
  useEffect(() => { localStorage.setItem('sjl_trans_target', JSON.stringify(targetLang)); }, [targetLang]);
  useEffect(() => { localStorage.setItem('sjl_trans_auto', JSON.stringify(autoDetect)); }, [autoDetect]);

  // Setup State
  const [hasStarted, setHasStarted] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'history'>('live');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Live State
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Transcription State (Visual Feedback)
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");

  // History State
  const [history, setHistory] = useState<TranslationItem[]>([]);

  // Refs for accumulation during turn
  const userBufferRef = useRef("");
  const aiBufferRef = useRef("");

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const closeRef = useRef<boolean>(false);
  const isSetupCompleteRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Auto-scroll history
  useEffect(() => {
    if (!isTheaterMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isTheaterMode, userTranscript, aiTranscript]);

  const cleanup = () => {
    closeRef.current = true;
    isSetupCompleteRef.current = false;
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { console.log("Erro ao fechar sessão Tradutor"); }
      sessionRef.current = null;
    }
    if (streamRef.current) { try { streamRef.current.getTracks().forEach(track => track.stop()); } catch (e) { } }
    if (processorRef.current) { try { processorRef.current.disconnect(); } catch (e) { } }

    // Fechamento defensivo de contextos de áudio
    try {
      if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close().catch(e => console.log("Erro fechar input context", e));
      }
    } catch (e) { }

    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.log("Erro fechar output context", e));
      }
    } catch (e) { }

    try {
      sourceNodesRef.current.forEach(node => { try { node.stop(); } catch (e) { } });
      sourceNodesRef.current.clear();
    } catch (e) { }
  };

  const startTranslation = async () => {
    setHasStarted(true);

    try {
      const apiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
      if (!apiKey) throw new Error("Aviso: Chave de API do Gemini não configurada no Admin ou ambiente.");

      const sanitizedKey = apiKey.trim();
      
      // Injeção de Força Bruta para burlar o erro "API Key must be set"
      if (typeof window !== 'undefined') {
        (window as any).process = (window as any).process || { env: {} };
        (window as any).process.env.GOOGLE_API_KEY = sanitizedKey;
        (window as any).process.env.API_KEY = sanitizedKey;
      }

      let ai: any;
      try {
        ai = new (GoogleGenAI as any)({ apiKey: sanitizedKey });
        ai.apiKey = sanitizedKey; // Atribuição direta forçada
        if (!ai.live) throw new Error();
      } catch (e) {
        ai = new (GoogleGenAI as any)(sanitizedKey);
        if (ai) ai.apiKey = sanitizedKey;
      }

      // Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      // Input Stream
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("O navegador bloqueou o microfone ou não suporta a gravação. O site precisa de conexão Segura (HTTPS) e permissão de microfone.");
      }
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
      const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(inputAudioContextRef.current.destination);

      // Obter contexto histórico do usuário
      let aiContext = "";
      try {
        aiContext = user ? await getAIContextForUser(user.uid) : "";
      } catch (ctxErr) {
        console.warn("Tradutor: Falha ao obter contexto:", ctxErr);
      }

      // System Instruction for Translator Persona
      const instruction = `
        ROLE: Professional Simultaneous Interpreter.
        TASK: Translate spoken audio in real-time between ${sourceLang.name} and ${targetLang.name}.
        MODE: ${autoDetect ? 'Bidirectional / Auto-detect' : `Unidirectional (${sourceLang.name} -> ${targetLang.name})`}
        RULES:
        1. IF input is ${sourceLang.name} -> OUTPUT ${targetLang.name}.
        2. IF input is ${targetLang.name} -> OUTPUT ${sourceLang.name}.
        3. NO CHAT: ONLY translate the user's words.
        4. OUTPUT MODALITY: Audio part and Text part MUST BE IDENTICAL.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: instruction }] },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
        },
        callbacks: {
          onopen: () => {
            console.log("Translation Session Open");
            setIsConnected(true);
            nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
          },
          onmessage: async (message: LiveServerMessage) => {
            if (closeRef.current) return;

            if (message.setupComplete) {
              isSetupCompleteRef.current = true;
            }

            const cleanText = (text: string) => {
              if (!text) return "";
              return text
                .replace(/^(input transcription|output transcription|translation|ai|assistant):\s*/gi, "")
                .trim();
            };

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) {
                userBufferRef.current = cleanText(text);
                setUserTranscript(userBufferRef.current);
              }
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text) {
                aiBufferRef.current = cleanText(text);
                setAiTranscript(aiBufferRef.current);
              }
            }

            if (message.serverContent?.turnComplete) {
              const newItem: TranslationItem = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                sourceText: userBufferRef.current,
                translatedText: aiBufferRef.current,
                sourceLang: sourceLang.label,
                targetLang: targetLang.label
              };

              if (newItem.sourceText.trim() || newItem.translatedText.trim()) {
                setHistory(prev => [...prev, newItem]);
              }

              userBufferRef.current = "";
              aiBufferRef.current = "";

              setTimeout(() => {
                if (!closeRef.current) {
                  setUserTranscript("");
                  setAiTranscript("");
                }
              }, 10000);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const pcmData = new Int16Array(base64ToArrayBuffer(base64Audio));
              const audioBuffer = pcmToAudioBuffer(pcmData, audioContextRef.current, 24000);
              const ctx = audioContextRef.current;
              const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              sourceNodesRef.current.add(source);
              source.onended = () => sourceNodesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourceNodesRef.current.forEach(node => { try { node.stop(); } catch (e) { } });
              sourceNodesRef.current.clear();
              nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
              setUserTranscript("");
              setAiTranscript("");
            }
          },
          onclose: () => setIsConnected(false),
          onerror: () => setIsConnected(false)
        }
      });

      sessionPromise.then(sess => {
        sessionRef.current = sess;
      });

      processor.onaudioprocess = async (e) => {
        if (isMuted || closeRef.current || !isSetupCompleteRef.current) return;
        
        if (inputAudioContextRef.current?.state === 'suspended') {
          await inputAudioContextRef.current.resume();
        }
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = float32ToInt16(inputData);
        const base64Data = arrayBufferToBase64(pcm16.buffer);

        if (sessionRef.current && !closeRef.current) {
          try {
            sessionRef.current.sendRealtimeInput({
              media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
            });
          } catch (e) {}
        }
      };

    } catch (e: any) {
      console.error(e);
    }
  };

  const handleEnd = () => {
    cleanup();
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportHistory = (format: 'txt' | 'json' | 'pdf') => {
    if (history.length === 0) return;
    const filename = `SJL_Traducao_${new Date().toISOString().slice(0, 10)}`;
    
    if (format === 'json') {
      downloadBlob(JSON.stringify(history, null, 2), `${filename}.json`, 'application/json');
    } else if (format === 'pdf') {
      window.print();
    } else {
      const content = history.map(item => `[${item.timestamp.toLocaleTimeString()}] ${item.sourceLang}: ${item.sourceText}\n   ${item.targetLang}: ${item.translatedText}`).join('\n\n');
      downloadBlob(content, `${filename}.txt`, 'text/plain');
    }
    setShowExportMenu(false);
  };

  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-4">
            <Globe className="w-10 h-10 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Configurar Tradutor</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Origem</label>
              <select 
                value={sourceLang.code}
                onChange={(e) => setSourceLang(LANGUAGES.find(l => l.code === e.target.value) || LANGUAGES[0])}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white mt-1"
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Destino</label>
              <select 
                value={targetLang.code}
                onChange={(e) => setTargetLang(LANGUAGES.find(l => l.code === e.target.value) || LANGUAGES[1])}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white mt-1"
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <button onClick={startTranslation} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/40">
            Iniciar Intérprete Neural
          </button>
          <button onClick={onClose} className="w-full text-slate-500 font-bold">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-[#020617] z-[60] flex flex-col font-sans ${isTheaterMode ? 'p-0' : ''}`}>
      {!isTheaterMode && (
        <div className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-yellow-500'}`}></div>
            <h3 className="text-white font-bold">Intérprete Neural</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsTheaterMode(true)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 hover:bg-slate-700 transition-all">
              MODO TEATRO
            </button>
            <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-2 text-slate-400 hover:text-white"><Download /></button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[70]">
                     <button onClick={() => exportHistory('txt')} className="w-full text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-300">Exportar TXT</button>
                     <button onClick={() => exportHistory('pdf')} className="w-full text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-300">Exportar PDF (Print)</button>
                  </div>
                )}
            </div>
            <button onClick={handleEnd} className="p-2 text-slate-400 hover:text-red-500"><X /></button>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden flex flex-col bg-[#020617]">
        {isTheaterMode ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-black">
             <button onClick={() => setIsTheaterMode(false)} className="absolute top-8 right-8 p-3 bg-slate-800 rounded-full text-white"><X /></button>
             <div className="w-full max-w-5xl text-center space-y-8">
                <AnimatePresence mode='wait'>
                  {userTranscript && (
                    <motion.p key="user" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-3xl text-slate-500 italic">
                      "{userTranscript}"
                    </motion.p>
                  )}
                  {aiTranscript && (
                    <motion.p key="ai" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-5xl md:text-7xl text-white font-black drop-shadow-2xl">
                      {aiTranscript}
                    </motion.p>
                  )}
                </AnimatePresence>
             </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
            <div className="max-w-4xl mx-auto w-full space-y-10">
              {history.length === 0 && !userTranscript && !aiTranscript && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <Globe className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">Pronto para traduzir. Comece a falar...</p>
                </div>
              )}

              {history.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 group">
                   {/* Source (Origem) */}
                   <div className="self-end max-w-[85%] md:max-w-[75%]">
                      <div className="flex items-center justify-end gap-2 mb-1 px-2">
                         <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest flex items-center gap-1.5">
                           Origem <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> {item.sourceLang}
                         </span>
                      </div>
                      <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-3xl rounded-tr-sm p-4 md:p-5 relative shadow-lg backdrop-blur-sm">
                         <p className="text-emerald-50 text-base leading-relaxed">{item.sourceText}</p>
                         <button onClick={() => copyToClipboard(item.sourceText)} className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-white transition-all bg-slate-900/50 rounded-lg"><FileText size={16}/></button>
                      </div>
                   </div>
                   
                   {/* Destination (Destino) */}
                   <div className="self-start max-w-[85%] md:max-w-[75%]">
                      <div className="flex items-center gap-2 mb-1 px-2">
                         <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                           Destino <span className="w-1 h-1 bg-blue-400 rounded-full"></span> {item.targetLang}
                         </span>
                      </div>
                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-3xl rounded-tl-sm p-5 md:p-6 relative shadow-2xl shadow-blue-900/20 backdrop-blur-md">
                         <p className="text-white font-bold text-xl md:text-2xl leading-tight tracking-tight">{item.translatedText}</p>
                         <button onClick={() => copyToClipboard(item.translatedText)} className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-white transition-all bg-slate-900/50 rounded-lg"><FileText size={16}/></button>
                         <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-500/10">
                            <span className="text-[9px] text-blue-400/50 font-bold uppercase tracking-widest">Tradução Instantânea</span>
                            <span className="text-[9px] text-slate-500">{item.timestamp.toLocaleTimeString()}</span>
                         </div>
                      </div>
                   </div>
                </div>
              ))}

              {(userTranscript || aiTranscript) && (
                <div className="flex flex-col gap-4 animate-pulse">
                   {userTranscript && (
                     <div className="self-end max-w-[85%] md:max-w-[75%]">
                        <div className="bg-slate-800/50 rounded-3xl p-4 border border-dashed border-slate-700 text-slate-400 italic">
                          {userTranscript}
                        </div>
                     </div>
                   )}
                   {aiTranscript && (
                     <div className="self-start max-w-[85%] md:max-w-[75%]">
                        <div className="bg-blue-900/10 rounded-3xl p-5 border border-dashed border-blue-800/50 text-blue-200/70 font-medium text-lg">
                          {aiTranscript}
                        </div>
                     </div>
                   )}
                </div>
              )}
              <div ref={messagesEndRef} className="h-10" />
            </div>
          </div>

        )}
      </div>

      <div className={`h-24 bg-slate-900/50 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-6 ${isTheaterMode ? 'bg-black border-none' : ''}`}>
        <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full border transition-all ${isMuted ? 'bg-red-500 border-red-600' : 'bg-slate-800 border-slate-700'}`}>
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button onClick={handleEnd} className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full shadow-lg shadow-red-900/40 transition-all active:scale-95">
          Encerrar Intérprete
        </button>
      </div>
    </div>
  );
};

export default LiveTranslation;
