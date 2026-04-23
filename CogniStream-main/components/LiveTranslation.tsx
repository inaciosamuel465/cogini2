
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
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
    if (viewMode === 'history') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, viewMode]);

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

      const ai = new GoogleGenAI({ apiKey });

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

      // Obter contexto histórico do usuário (com proteção contra erros)
      let aiContext = "";
      try {
        aiContext = user ? await getAIContextForUser(user.uid) : "";
      } catch (ctxErr) {
        console.warn("Tradutor: Falha ao obter contexto (pode ser 429 ou índice):", ctxErr);
      }

      // System Instruction for Translator Persona
      const instruction = `
        ROLE: Professional Simultaneous Interpreter.

        CONTEXTO DO USUÁRIO (HISTORICO):
        ${aiContext || "Sem histórico relevante."}
        
        TASK:
        Translate spoken audio in real-time between ${sourceLang.name} and ${targetLang.name}.
        
        MODE: ${autoDetect ? 'Bidirectional / Auto-detect' : `Unidirectional (${sourceLang.name} -> ${targetLang.name})`}

        RULES:
        1. IF input is ${sourceLang.name} -> OUTPUT ${targetLang.name}.
        2. IF input is ${targetLang.name} -> OUTPUT ${sourceLang.name}.
        3. NO CHAT: You are a VOICE TO VOICE TRANSLATOR. Do NOT say "Sure", "Hello", "How can I help?". ONLY translate the user's words.
        4. FORMAT: Direct translation only. DO NOT add conversational meta-talk or explanations.
        5. OUTPUT MODALITY: Audio part and Text part MUST BE IDENTICAL and ONLY contain the translated content.
        6. NO EXPLANATIONS: If the user says something, just provide the equivalent in the other language. Zero extra words.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
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
              console.log("Translation Client Setup Complete!");
              isSetupCompleteRef.current = true;
            }

            // 1. Handle Transcription (Accumulate)
            const cleanText = (text: string) => {
              if (!text) return "";
              // Regex aprimorada para remover qualquer prefixo técnico do Gemini e metadados SJL
              return text
                .replace(/^(input transcription|detected language|output transcription|translation|speaker|system|ai|assistant|sarah jane|Sarah Jane):\s*/gi, "")
                .replace(/\*\*.*?\*\*/g, "")
                .replace(/\[.*?\]/gi, "")
                .replace(/START_PHRASE:\s*\d+|PHRASE_APPROVED|PHRASE_FAILED|SESSION_COMPLETE|SCENARIO_COMPLETE/gi, "")
                .replace(/\b(I've translated|I have translated|Direct translation|Translating|The translation is|Traduzindo|A tradução é|Sure, here is the translation)\b.*/gi, "")
                .replace(/\b(true|false|null|undefined)\b/gi, "")
                .replace(/[{}"]/g, "") // Remove resíduos de JSON se houver
                .trim();
            };

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) {
                const filteredText = cleanText(text);
                if (filteredText) {
                  // Para inputTranscription (voz do usuário), a API do Gemini 
                  // frequentemente envia o texto acumulado. Substituímos para evitar duplicação.
                  userBufferRef.current = filteredText;
                  setUserTranscript(userBufferRef.current);
                }
              }
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text) {
                const filteredText = cleanText(text);
                if (filteredText) {
                  aiBufferRef.current = filteredText;
                  setAiTranscript(aiBufferRef.current);
                }
              }
            }

            // Fallback para texto no modelTurn (Chunks de geração)
            const turnText = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (turnText) {
              const filteredText = cleanText(turnText);
              if (filteredText) {
                aiBufferRef.current += (aiBufferRef.current ? " " : "") + filteredText;
                setAiTranscript(aiBufferRef.current);
              }
            }

            // Save to History on Turn Complete
            if (message.serverContent?.turnComplete) {
              // Push to history
              const newItem: TranslationItem = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                sourceText: userBufferRef.current,
                translatedText: aiBufferRef.current,
                sourceLang: sourceLang.label, // In auto-detect this is an approximation
                targetLang: targetLang.label
              };

              if (newItem.sourceText.trim() || newItem.translatedText.trim()) {
                setHistory(prev => [...prev, newItem]);
              }

              // Reset buffers
              userBufferRef.current = "";
              aiBufferRef.current = "";

              // Clear UI with delay for readability in Live Mode - Increased for better tracking
              setTimeout(() => {
                if (!closeRef.current) {
                  setUserTranscript("");
                  setAiTranscript("");
                }
              }, 8000); // 8 seconds for better readability
            }

            // 2. Handle Audio Output (Translation)
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

            // 3. Handle Interruptions
            if (message.serverContent?.interrupted) {
              sourceNodesRef.current.forEach(node => { try { node.stop(); } catch (e) { } });
              sourceNodesRef.current.clear();
              nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
              userBufferRef.current = "";
              aiBufferRef.current = "";
              setUserTranscript("");
              setAiTranscript("");
            }
          },
          onclose: (e) => {
            console.log("Translation: WebSocket closed", e);
            setIsConnected(false);
            closeRef.current = true;
            isSetupCompleteRef.current = false;

            // Salvar memória das traduções realizadas
            if (user && history.length > 0) {
              const summary = history.map(h => `${h.sourceLang}: ${h.sourceText} -> ${h.targetLang}: ${h.translatedText}`).join('\n');
              saveAIMemory({
                userId: user.uid,
                module: 'Tradução',
                type: 'translation',
                content: `Sessão de tradução finalizada. Conteúdo traduzido:\n${summary.slice(0, 1000)}${summary.length > 1000 ? '...' : ''}`
              });
            }
          },
          onerror: (e) => {
            console.error(e);
            closeRef.current = true;
            isSetupCompleteRef.current = false;
          }
        }
      });

      sessionPromise.then(sess => {
        sessionRef.current = sess;
      });

      processor.onaudioprocess = async (e) => {
        if (isMuted || closeRef.current || !isSetupCompleteRef.current) return;

        // Ensure audio context is running
        if (inputAudioContextRef.current?.state === 'suspended') {
          await inputAudioContextRef.current.resume();
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = float32ToInt16(inputData);
        const base64Data = arrayBufferToBase64(pcm16.buffer);

        if (sessionRef.current && !closeRef.current) {
          try {
            sessionRef.current.sendRealtimeInput({
              media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
            });
          } catch (e) {
            console.log("WebSocket erro ao enviar áudio no Tradutor.");
          }
        }
      };

    } catch (e: any) {
      console.error(e);
    }
  };

  const handleEnd = () => {
    try {
      cleanup();
    } catch (e) { console.log("Erro durante cleanup da tradução", e); }
    onClose();
  };

  const exportHistory = (format: 'txt' | 'json') => {
    if (history.length === 0) return;

    let content = "";
    const filename = `SJL_Traducao_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      content = JSON.stringify(history, null, 2);
    } else {
      content = `HISTÓRICO DE TRADUÇÃO - SJL INTERPRETER\nData: ${new Date().toLocaleString()}\nIdiomas: ${sourceLang.label} <-> ${targetLang.label}\n\n`;
      content += history.map(item => {
        return `[${item.timestamp.toLocaleTimeString()}] ORIGINAL: ${item.sourceText}\n   TRADUÇÃO: ${item.translatedText}\n-------------------`;
      }).join('\n');
    }

    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // --- RENDER: SETUP SCREEN ---
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-10"></div>
        <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          <div className="flex items-center gap-4 mb-8">
            <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20">
              <Globe className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Configurar Tradução</h2>
              <p className="text-slate-400 text-sm">Selecione os idiomas para o intérprete.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Source Lang */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Idioma 1 (Você)</label>
                <div className="relative">
                  <select
                    value={sourceLang.code}
                    onChange={(e) => setSourceLang(LANGUAGES.find(l => l.code === e.target.value) || LANGUAGES[0])}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-xs text-slate-500">▼</span>
                  </div>
                </div>
              </div>

              {/* Target Lang */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Idioma 2 (Destino)</label>
                <div className="relative">
                  <select
                    value={targetLang.code}
                    onChange={(e) => setTargetLang(LANGUAGES.find(l => l.code === e.target.value) || LANGUAGES[1])}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-xs text-slate-500">▼</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Detect Toggle */}
            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="block text-sm font-semibold text-slate-200">Conversa Bidirecional</span>
                  <span className="block text-xs text-slate-500">Detectar idioma automaticamente</span>
                </div>
              </div>
              <button
                onClick={() => setAutoDetect(!autoDetect)}
                className={`w-12 h-6 rounded-full transition-colors relative ${autoDetect ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoDetect ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 font-medium">
                Cancelar
              </button>
              <button onClick={startTranslation} className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 fill-current" /> Iniciar Intérprete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: LIVE INTERFACE ---
  return (
    <div className="fixed inset-0 bg-[#020617] z-[60] flex flex-col animate-fade-in font-sans">
      {/* Header - Adjusted for better visibility on mobile */}
      <div className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${isConnected ? 'bg-emerald-500 text-emerald-500' : 'bg-yellow-500 text-yellow-500'}`}></div>
          <div>
            <h3 className="text-white font-semibold tracking-wide flex items-center gap-2">
              Intérprete Neural
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-400">
                {history.length} turnos
              </span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              {sourceLang.label} <ArrowRightLeft className="w-3 h-3" /> {targetLang.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">


          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <Download className="w-6 h-6" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={() => exportHistory('txt')} className="w-full text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-300 hover:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Exportar TXT
                </button>
                <button onClick={() => exportHistory('json')} className="w-full text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-300 hover:text-white flex items-center gap-2">
                  <Code className="w-4 h-4" /> Exportar JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#020617] scroll-smooth">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pt-4 pb-20">
            {history.length === 0 && !userTranscript && !aiTranscript && (
              <div className="text-center text-slate-500 py-20 flex flex-col items-center animate-fade-in">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p>O intérprete está online. Fale para começar a tradução simultânea.</p>
              </div>
            )}
            
            {/* Histórico Consolidado */}
            {history.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 animate-fade-in">
                {/* Balão do Usuário (Original) */}
                {item.sourceText && (
                  <div className="self-end max-w-[85%] md:max-w-[70%]">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest block mb-1 text-right px-1">
                      Você ({item.sourceLang})
                    </span>
                    <div className="bg-emerald-600/20 text-emerald-50 rounded-2xl rounded-tr-sm p-4 border border-emerald-500/20 shadow-lg backdrop-blur-sm">
                      <p className="text-lg leading-relaxed">{item.sourceText}</p>
                    </div>
                  </div>
                )}
                
                {/* Balão da IA (Tradução) */}
                {item.translatedText && (
                  <div className="self-start max-w-[85%] md:max-w-[70%]">
                    <span className="text-[10px] text-purple-400 uppercase tracking-widest block mb-1 px-1">
                      Intérprete ({item.targetLang})
                    </span>
                    <div className="bg-purple-600/20 text-purple-50 rounded-2xl rounded-tl-sm p-4 border border-purple-500/20 shadow-lg backdrop-blur-sm">
                      <p className="text-lg font-medium leading-relaxed">{item.translatedText}</p>
                      <span className="text-[10px] text-slate-500 mt-2 block">{item.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Turno Ativo (Ao Vivo) */}
            {userTranscript && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="self-end max-w-[85%] md:max-w-[70%]">
                  <span className="text-[10px] text-emerald-400/70 uppercase tracking-widest block mb-1 text-right px-1 flex items-center justify-end gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Ouvindo...
                  </span>
                  <div className="bg-emerald-600/10 text-emerald-50/80 rounded-2xl rounded-tr-sm p-4 border border-emerald-500/20 border-dashed backdrop-blur-sm">
                    <p className="text-lg leading-relaxed">{userTranscript}</p>
                  </div>
                </div>
              </div>
            )}

            {aiTranscript && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="self-start max-w-[85%] md:max-w-[70%] mt-2">
                  <span className="text-[10px] text-purple-400/70 uppercase tracking-widest block mb-1 px-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                    Traduzindo...
                  </span>
                  <div className="bg-purple-600/10 text-purple-50/80 rounded-2xl rounded-tl-sm p-4 border border-purple-500/20 border-dashed backdrop-blur-sm">
                    <p className="text-lg font-medium leading-relaxed">{aiTranscript}</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

      </div>

      {/* Footer Controls */}
      <div className="h-24 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-center gap-8 z-10 shrink-0">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full border transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800 border-slate-600 text-white hover:border-white hover:bg-slate-700'
            }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={handleEnd}
          className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
        >
          <PhoneOff className="w-5 h-5 fill-current" /> Encerrar Sessão
        </button>
      </div>
    </div>
  );
};

export default LiveTranslation;
