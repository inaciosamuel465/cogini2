
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, PhoneOff, User, Briefcase, Lock, CheckCircle2, TrendingUp, Play, RefreshCw, ChevronDown, FileText, BarChart3, Wifi, BrainCircuit, Activity, Volume2, Sparkles, AlertCircle, ArrowRight, X, Zap } from 'lucide-react';
import { base64ToArrayBuffer, float32ToInt16, pcmToAudioBuffer, arrayBufferToBase64Safe as arrayBufferToBase64 } from '../services/audioUtils';
import { generateDocument } from '../services/documentService';
import { AnalysisResult } from '../types';
import { SYLLABUS as DEFAULT_SYLLABUS, LEVELS, AREAS, EnglishLevel, CorporateArea, Phrase, SCENARIOS, Scenario } from '../data/syllabus';
import { useNotifications } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { saveAIMemory, getAIContextForUser } from '../services/aiMemoryService';

interface Props {
  onClose: () => void;
  initialArea?: CorporateArea;
  initialLevel?: EnglishLevel;
  directStart?: boolean;
  isPopup?: boolean;
}

// --- AVATAR COMPONENT ---
interface AvatarProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking' | 'correcting';
  volume: number; // 0-100
  name?: string;
  isMini?: boolean;
}

const InstructorAvatar: React.FC<AvatarProps> = ({ state, volume, name = "Instrutora", isMini }) => {
  const [smoothVol, setSmoothVol] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setSmoothVol(prev => prev + (volume - prev) * 0.15);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [volume]);

  const isSpeaking = state === 'speaking';
  const isCorrecting = state === 'correcting';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  const baseScale = isListening ? 1.05 : 1;
  const talkingScale = (isSpeaking || isCorrecting) ? 1 + (Math.max(0, smoothVol - 5) / 400) : baseScale;

  const themeColor =
    isCorrecting ? 'border-amber-500 shadow-amber-500/50' :
      isListening ? 'border-emerald-500 shadow-emerald-500/50' :
        isProcessing ? 'border-indigo-500 shadow-indigo-500/50' :
          isSpeaking ? 'border-blue-400 shadow-blue-400/50' :
            'border-slate-600 shadow-none';

  return (
    <div className={`relative flex items-center justify-center transition-all duration-700 ${isMini ? 'w-32 h-32 md:w-40 md:h-40' : 'w-60 h-60 md:w-96 md:h-96'}`}>
      <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-500 ${isListening ? 'bg-emerald-500/30 opacity-60' : isSpeaking ? 'bg-blue-500/30 opacity-50' : isCorrecting ? 'bg-amber-500/30 opacity-60' : isProcessing ? 'bg-indigo-500/30 opacity-40' : 'bg-transparent opacity-0'}`}></div>
      <div className={`absolute inset-[-10px] md:inset-[-20px] rounded-full border border-slate-800/80 border-dashed transition-all duration-1000 ${isProcessing ? 'animate-spin-slow opacity-100' : 'opacity-30'}`}></div>
      <div className={`absolute inset-0 rounded-full border transition-all duration-100 ${themeColor}`} style={{ opacity: (isSpeaking || isListening) ? 0.3 + (smoothVol / 100) : 0, transform: `scale(${1 + (smoothVol / 150)})` }}></div>
      <div className={`relative rounded-full p-1.5 bg-gradient-to-b from-slate-800 to-slate-950 shadow-2xl z-10 transition-transform duration-300 ease-out ${isMini ? 'w-28 h-28 md:w-32 md:h-32' : 'w-52 h-52 md:w-80 md:h-80'}`} style={{ transform: `scale(${talkingScale})` }}>
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 relative">
          <img src="/sjl_avatar.png" alt="Sarah Jane" className={`w-full h-full object-contain pt-4 transition-all duration-700 ${isCorrecting ? 'sepia-[.3] contrast-125' : isListening ? 'scale-110 brightness-110' : 'scale-100'}`} />
          <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none mix-blend-overlay ${isProcessing ? 'bg-indigo-900/60 opacity-100' : isListening ? 'bg-emerald-900/20 opacity-100' : 'opacity-0'}`}></div>
        </div>
        <div className={`absolute inset-0 rounded-full border-[3px] transition-colors duration-500 ${themeColor.split(' ')[0]}`}></div>
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg z-20">
          {isListening ? <Mic className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 animate-pulse" /> : isProcessing ? <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 animate-spin" /> : isCorrecting ? <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> : isSpeaking ? <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /> : <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-slate-600"></div>}
        </div>
      </div>
      <div className="absolute -bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 w-max animate-fade-in">
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-1.5 md:px-5 md:py-2 rounded-full border border-slate-700 flex items-center gap-2 md:gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors duration-300 ${isListening ? 'bg-emerald-500 animate-pulse' : isSpeaking ? 'bg-blue-500' : isProcessing ? 'bg-indigo-500' : isCorrecting ? 'bg-amber-500' : 'bg-slate-500'}`}></div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] md:text-[11px] font-bold text-slate-200 uppercase tracking-widest">
              {isCorrecting ? 'Correção em Andamento' : isSpeaking ? name : isListening ? 'Ouvindo Você...' : isProcessing ? 'Analisando...' : 'Online'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AppState {
  level: EnglishLevel;
  area: CorporateArea;
  mode: 'repetition' | 'roleplay';
  completedPhrases: string[];
  completedScenarios: string[];
  stats: { totalAttempts: number; correctAttempts: number; errors: number; };
  totalXP: number;
  streakCount: number;
  badges: string[];
  lastActiveDate?: string; // YYYY-MM-DD
}

const DEFAULT_STATE: AppState = {
  level: 'Iniciante',
  area: 'Gestão',
  mode: 'repetition',
  completedPhrases: [],
  completedScenarios: [],
  stats: { totalAttempts: 0, correctAttempts: 0, errors: 0 },
  totalXP: 0,
  streakCount: 0,
  badges: [],
  lastActiveDate: undefined
};

const SJLLiveConversation: React.FC<Props> = ({ onClose, initialArea, initialLevel, directStart, isPopup }) => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sjl_state_v3');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (initialArea) parsed.area = initialArea;
          if (initialLevel) parsed.level = initialLevel;
          return { ...DEFAULT_STATE, ...parsed };
        } catch (e) { console.error(e); }
      }
    }
    return { ...DEFAULT_STATE, area: initialArea || DEFAULT_STATE.area, level: initialLevel || DEFAULT_STATE.level };
  });

  const [syllabus, setSyllabus] = useState<typeof DEFAULT_SYLLABUS>(DEFAULT_SYLLABUS);
  const instructorName = settings.sjl.instructorName;
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    localStorage.setItem('sjl_state_v3', JSON.stringify(appState));
  }, [appState]);

  const { showToast } = useNotifications();
  const [step, setStep] = useState<'intro' | 'dashboard' | 'live'>(directStart ? 'live' : 'intro');

  useEffect(() => {
    if (directStart && step === 'live' && !isConnected && !sessionRef.current) {
      startSession();
    }
  }, [directStart, step]);
  const [sessionPhrases, setSessionPhrases] = useState<Phrase[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [activePhraseIndex, setActivePhraseIndex] = useState(-1);
  const [avatarState, setAvatarState] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'correcting'>('idle');
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPhraseApproved, setIsPhraseApproved] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  const closeRef = useRef<boolean>(false);
  const isSetupCompleteRef = useRef<boolean>(false);
  const commandBufferRef = useRef<string>("");

  const getLevelPhrases = (lvl: string, ar: string) => syllabus[lvl]?.[ar] || [];
  const currentLevelProgress = useMemo(() => {
    const all = getLevelPhrases(appState.level, appState.area);
    if (all.length === 0) return 0;
    return Math.round((all.filter(p => appState.completedPhrases.includes(p.id)).length / all.length) * 100);
  }, [appState, syllabus]);

  const accuracyRate = appState.stats.totalAttempts > 0 ? Math.round((appState.stats.correctAttempts / appState.stats.totalAttempts) * 100) : 0;

  // --- CLOUD SYNC ---
  const syncProgressToCloud = async (state: AppState) => {
    if (!user) return;
    try {
      // Cálculo de Ofensiva (Streak)
      const today = new Date().toISOString().split('T')[0];
      let newStreak = state.streakCount || 0;

      if (state.lastActiveDate !== today) {
        if (state.lastActiveDate) {
          const lastDate = new Date(state.lastActiveDate);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (state.lastActiveDate === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }
      }

      const updatedState = {
        ...state,
        streakCount: newStreak,
        lastActiveDate: today
      };

      await setDoc(doc(db, 'user_progress', user.uid), {
        ...updatedState,
        userId: user.uid,
        lastActive: serverTimestamp()
      }, { merge: true });

      // Também atualizar no perfil do usuário para facilitar exibição global
      await setDoc(doc(db, 'users', user.uid), {
        totalXP: state.totalXP,
        streakCount: newStreak,
        badges: state.badges
      }, { merge: true });

    } catch (e) {
      console.error("Erro ao sincronizar:", e);
    }
  };

  useEffect(() => {
    if (user) {
      const loadCloud = async () => {
        try {
          const snap = await getDoc(doc(db, 'user_progress', user.uid));
          if (snap.exists()) {
            const cloud = snap.data() as AppState;
            setAppState(prev => ({
              ...prev,
              ...cloud,
              // Garantir que não perdemos progresso local caso a nuvem esteja atrasada
              completedPhrases: Array.from(new Set([...prev.completedPhrases, ...(cloud.completedPhrases || [])])),
              completedScenarios: Array.from(new Set([...prev.completedScenarios, ...(cloud.completedScenarios || [])])),
              totalXP: Math.max(prev.totalXP, cloud.totalXP || 0),
              streakCount: Math.max(prev.streakCount, cloud.streakCount || 0)
            }));
          }
        } catch (err) {
          console.error("Erro ao carregar do Firebase:", err);
        }
      };
      loadCloud();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('sjl_state_v3', JSON.stringify(appState));
    if (user && appState !== DEFAULT_STATE) {
      syncProgressToCloud(appState);
    }
  }, [appState, user]);

  useEffect(() => {
    if (directStart && step === 'live') {
      // Start session automatically if directStart is true
      if (sessionPhrases.length === 0 && !isConnected && activePhraseIndex === -1 && !closeRef.current && avatarState === 'idle') {
        startSession();
      }
    }
  }, [directStart, step]);

  const handleExportReport = () => {
    const resultData: AnalysisResult = {
      transcription: "N/A", translation: "N/A", language: "Português", sentiment: "Positivo", tone: "Profissional",
      keywords: ["English", "Corporate", appState.area, appState.level],
      summary: {
        executive: `Progresso: ${currentLevelProgress}% no módulo ${appState.area}.`,
        bulletPoints: [], detailed: "", insights: [], risksAndOpportunities: [], technicalObservations: "", actionPlan: []
      },
      segments: []
    };
    generateDocument(resultData, 'pdf', `SJL_Relatorio_${appState.area}`);
    if (user) {
      saveAIMemory({
        userId: user.uid,
        module: 'SJL',
        type: 'report',
        content: `Relatório de desempenho exportado para o módulo ${appState.area}. Exercícios concluídos: ${appState.completedPhrases.length}.`
      });
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    const updateVisualizer = () => {
      if (analyserRef.current && isConnected) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolumeLevel(average);
        if (avatarState !== 'speaking' && avatarState !== 'correcting' && avatarState !== 'processing') {
          setAvatarState(average > 10 ? 'listening' : 'idle');
        }
      }
      animationFrameId = requestAnimationFrame(updateVisualizer);
    };
    if (step === 'live') updateVisualizer();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isConnected, step, avatarState]);

  const cleanup = () => {
    closeRef.current = true;
    if (sessionRef.current) { try { sessionRef.current.close(); } catch (e) { console.log("Erro ao fechar sessão Gemini"); } }
    if (streamRef.current) { try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) { } }

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
      sourceNodesRef.current.forEach(n => { try { n.stop(); } catch (e) { } });
      sourceNodesRef.current.clear();
    } catch (e) { }
  };

  const processCommand = (buffer: string) => {
    const startMatch = buffer.match(/START_PHRASE:\s*(\d+)/);
    if (startMatch?.[1]) {
      const idx = parseInt(startMatch[1]);
      if (idx >= 0 && idx < sessionPhrases.length) { setActivePhraseIndex(idx); setAvatarState('speaking'); return true; }
    }
    if (buffer.includes("PHRASE_APPROVED")) {
      setIsPhraseApproved(true);
      if (activePhraseIndex >= 0 && activePhraseIndex < sessionPhrases.length) {
        const id = sessionPhrases[activePhraseIndex].id;
        setAppState(prev => {
          const alreadyDone = prev.completedPhrases.includes(id);
          const newXP = alreadyDone ? prev.totalXP : prev.totalXP + 10;
          const newPhrases = alreadyDone ? prev.completedPhrases : [...prev.completedPhrases, id];

          if (!alreadyDone) {
            showToast("+10 XP: Expressão Aprendida!", 'success');
          }

          // Lógica de Medalhas
          const newBadges = [...prev.badges];
          if (newPhrases.length >= 10 && !newBadges.includes('Explorador')) {
            newBadges.push('Explorador');
            showToast("Nova Medalha: Explorador das Sombras!", 'success');
          }
          if (newPhrases.length >= 50 && !newBadges.includes('Fluente')) {
            newBadges.push('Fluente');
            showToast("Nova Medalha: Dominância Linguística!", 'success');
          }

          const updated = {
            ...prev,
            completedPhrases: newPhrases,
            totalXP: newXP,
            badges: newBadges,
            stats: {
              ...prev.stats,
              totalAttempts: prev.stats.totalAttempts + 1,
              correctAttempts: prev.stats.correctAttempts + 1
            }
          };

          // Sincronização imediata para evitar perda em caso de saída abrupta
          if (user) syncProgressToCloud(updated);

          return updated;
        });
      }
      return true;
    }
    if (buffer.includes("PHRASE_FAILED")) {
      setAvatarState('correcting');
      setIsPhraseApproved(false);
      setAppState(prev => ({ ...prev, stats: { ...prev.stats, totalAttempts: prev.stats.totalAttempts + 1, errors: prev.stats.errors + 1 } }));
      return true;
    }
    if (buffer.includes("SESSION_COMPLETE")) { setActivePhraseIndex(sessionPhrases.length); return true; }
    if (buffer.includes("SCENARIO_COMPLETE")) {
      if (currentScenario) setAppState(prev => prev.completedScenarios.includes(currentScenario.id) ? prev : { ...prev, completedScenarios: [...prev.completedScenarios, currentScenario.id] });
      setActivePhraseIndex(100); return true;
    }
    return false;
  };

  const fetchPhrasesFromCloud = async () => {
    try {
      const modulesSnap = await getDocs(collection(db, 'modules'));
      const areaToMatch = appState.area.toLowerCase();

      const targetModule = modulesSnap.docs.find(d => {
        const name = d.data().name.toLowerCase();
        // Mapeamento de normalização para evitar o erro "Módulo não encontrado"
        const normalizedName =
          name === 'conversação dinâmica' ? 'gestão' :
            name === 'gestão' ? 'conversação dinâmica' : name;

        return name === areaToMatch ||
          name.includes(areaToMatch) ||
          areaToMatch.includes(name) ||
          normalizedName === areaToMatch;
      });

      if (!targetModule) {
        console.warn(`SJL: Módulo "${appState.area}" não encontrado no Cloud. Usando fallback.`);
        return (DEFAULT_SYLLABUS[appState.level] && DEFAULT_SYLLABUS[appState.level][appState.area]) || [];
      }

      console.log(`SJL: Carregando frases do módulo: ${targetModule.data().name} (${targetModule.id})`);

      const q = query(
        collection(db, 'phrases'),
        where('moduleId', '==', targetModule.id),
        where('level', '==', appState.level)
      );
      const snap = await getDocs(q);
      const cloudPhrases = snap.docs.map(d => d.data() as Phrase).sort((a, b) => a.order - b.order);

      // Se não houver frases no Cloud (0 frases), retornar fallback em vez de lista vazia
      if (cloudPhrases.length === 0) {
        console.warn("SJL: Nenhuma frase encontrada no Cloud para este módulo/nível. Usando fallback.");
        return (DEFAULT_SYLLABUS[appState.level] && DEFAULT_SYLLABUS[appState.level][appState.area]) || [];
      }

      return cloudPhrases;
    } catch (e) {
      console.error("SJL: Erro ao carregar frases:", e);
      return (DEFAULT_SYLLABUS[appState.level] && DEFAULT_SYLLABUS[appState.level][appState.area]) || [];
    }
  };

  const startSession = async () => {
    if (isConnected || isConnecting) {
      console.log("SJL: Já existe uma conexão ativa.");
      return;
    }

    setIsConnecting(true);
    setAvatarState('processing');

    let targetPhrases: Phrase[] = [];
    try {
      targetPhrases = await fetchPhrasesFromCloud();
      console.log("SJL: Total de frases para a sessão:", targetPhrases.length);
    } catch (err) {
      console.error("SJL: Erro fatal ao buscar frases:", err);
      setIsConnecting(false);
      setAvatarState('idle');
      return;
    }

    let sysInstructionStr = "";
    let aiContext = "";

    try {
      aiContext = user ? await getAIContextForUser(user.uid) : "";
    } catch (ctxErr: any) {
      console.warn("SJL: Falha ao obter contexto do usuário (pode ser 429 ou índice):", ctxErr);
      // Não trava a sessão por erro de contexto
    }

    if (appState.mode === 'repetition') {
      const remainingPhrases = targetPhrases.filter(p => !appState.completedPhrases.includes(p.id));
      targetPhrases = remainingPhrases.slice(0, 5);

      if (targetPhrases.length === 0) {
        // Ao invés de bloquear com alert(), usar toast e permitir reinício
        showToast("🎉 Você concluiu todas as frases disponíveis! Reiniciando o ciclo para prática contínua.", "success");
        // Reiniciar ciclo: limpar completedPhrases para este nível/área e recarregar
        setAppState(prev => ({
          ...prev,
          completedPhrases: prev.completedPhrases.filter(id =>
            !targetPhrases.some(p => p.id === id) // mantém progresso de outros módulos
          )
        }));
        // Recarregar frases do zero
        try {
          targetPhrases = await fetchPhrasesFromCloud();
          targetPhrases = targetPhrases.slice(0, 5);
        } catch (e) { /* fallback já tratado */ }

        if (targetPhrases.length === 0) {
          setIsConnecting(false);
          setAvatarState('idle');
          showToast("Nenhuma frase disponível para este módulo/nível. Tente mudar o nível.", "error");
          return;
        }
      }
      setSessionPhrases(targetPhrases);

      const userName = user?.preferredName || user?.displayName?.split(' ')[0] || "Pro";
      const greetingMap: any = {
        formal: "Seja muito formal, respeitoso e use títulos se necessário.",
        casual: "Seja muito casual, use gírias leves corporativas e seja amigável.",
        direct: "Seja extremamente direta e eficiente. Evite conversa fiada.",
        motivational: "Seja altamente enérgica, motivadora e use frases de incentivo."
      };
      const selectedGreeting = user?.greetingStyle ? greetingMap[user.greetingStyle] : "Equilibrado.";

      sysInstructionStr = `
            ${settings.aiSystemContext ? `SYSTEM CORE CONTEXT: ${settings.aiSystemContext}` : ""}
            IDENTITY: Fernanda, sua Assistente CogniStream de Suporte e Prática Lingüística. 
            ROLE: Você não é apenas uma professora isolada, você é o suporte inteligente do aluno dentro do ecossistema CogniStream. Seu papel é dar assistência, tirar dúvidas sobre o sistema e praticar o conteúdo do módulo de forma integrada.
            TONE: ${settings.voiceTone}. 
            PERSONALITY: Você é empática, extremamente profissional, prestativa e funciona como um braço direito do aluno na jornada de fluidez.
            GREETING STYLE: ${selectedGreeting}
            LEARNING FOCUS: ${user?.learningFocus || "Geral corporativo"}.
            LANGUAGE: Seu objetivo é DAR ASSISTÊNCIA e PRATICAR INGLÊS. Use o Português para dar suporte, explicar o funcionamento do CogniStream e encorajar o aluno. O Inglês deve ser usado para exemplos e para a prática de conversação solicitada pelo aluno.

            NÍVEL DO ALUNO NO COGNISTREAM: ${appState.level}. 
            MÓDULO ATUAL: ${appState.area}.

            INTERACÕES ANTERIORES E PROGRESSO:
            ${aiContext || "Sem histórico prévio disponível."}

            PRODUTO: CogniStream (O sistema operacional de aprendizagem cognitiva).
            MISSÃO: Auxiliar o aluno "${userName}" a dominar o inglês corporativo através da prática no módulo ${appState.area}.

            METODOLOGIA DE ASSISTÊNCIA - ORDEM OBRIGATÓRIA:
            1. COMANDO DE EXIBIÇÃO: Antes de iniciar uma frase de prática, você DEVE emitir: "START_PHRASE: <index>".
            2. RECONHECIMENTO: Comece sempre validando que você é a assistente de suporte do CogniStream.
            3. APOIO PEDAGÓGICO:
               - Se o aluno tiver dificuldades no módulo, explique a gramática ou o vocabulário de forma simples em Português.
               - Dê exemplos práticos em Inglês.
            4. PRÁTICA INTEGRADA:
               - Peça para o aluno praticar a frase atual: "Como sua assistente, vamos praticar? Repita comigo: [Frase]".
            5. FEEDBACK E SUCESSO:
               - SE BOM: Diga "Great job!" e emita "PHRASE_APPROVED".
               - SE PRECISAR MELHORAR: Diga "Vamos tentar de novo?" e emita "PHRASE_FAILED".
            6. FINALIZAÇÃO: Encerre a sessão de assistência com "SESSION_COMPLETE" após o suporte necessário.

            FRASES DO MÓDULO "${appState.area}": ${JSON.stringify(targetPhrases.map(p => ({ en: p.english, pt: p.portuguese })))}
      `;
    } else {
      setSessionPhrases([]);
      const scenario = (SCENARIOS[appState.level]?.[appState.area] || []).find(s => !appState.completedScenarios.includes(s.id));
      if (!scenario) {
        setIsConnecting(false);
        setAvatarState('idle');
        showToast("Todos os cenários de roleplay foram concluídos! Troque o nível para continuar.", "success");
        return;
      }
      setCurrentScenario(scenario);
      sysInstructionStr = `
        ${settings.aiSystemContext ? `SYSTEM CORE CONTEXT: ${settings.aiSystemContext}` : ""}
        ROLEPLAY: ${scenario.title}. 
        AI ROLE: ${scenario.aiRole}. 
        USER ROLE: Student/Employee.
        OBJECTIVE: ${scenario.objective}. 
        CONTEXTO DO USUÁRIO (HISTÓRICO): ${aiContext}
        FOCO DE APRENDIZADO DO USUÁRIO: ${user?.learningFocus}
        ESTILO DE CONVERSA: ${user?.greetingStyle || 'Padrão'}
        
        INSTRUCTION: Be a proactive conversational partner. If the user succeeds in the goal, output "SCENARIO_COMPLETE".
      `;
    }

    setStep('live');
    setActivePhraseIndex(-1);
    setAvatarState('processing');
    commandBufferRef.current = "";

    try {
      const apiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
      if (!apiKey) throw new Error("Chave de API do Gemini não encontrada nas configurações.");

      const ai = new GoogleGenAI({ apiKey });
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("O navegador bloqueou o microfone ou não suporta a gravação. O site precisa de conexão Segura (HTTPS) e permissão de microfone.");
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      analyserRef.current = inputAudioContextRef.current.createAnalyser();
      const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);
      const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(inputAudioContextRef.current.destination);

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: sysInstructionStr }] },
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
        callbacks: {
          onopen: () => { console.log("WebSocket connected. Waiting setup..."); },
          onmessage: async (msg) => {
            if (closeRef.current) return;
            if (msg.setupComplete) {
              console.log("Client Setup Complete!");
              isSetupCompleteRef.current = true;
              setIsConnected(true);
              setIsConnecting(false); // <--- RESET CONNECTING HERE
              setAvatarState('speaking');
              nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
            const transcript = msg.serverContent?.outputTranscription?.text;
            if (transcript) {
              const cleanTranscript = transcript.replace(/START_PHRASE:\s*\d+|PHRASE_APPROVED|PHRASE_FAILED|SESSION_COMPLETE|SCENARIO_COMPLETE/g, '');
              commandBufferRef.current += transcript;

              if (processCommand(commandBufferRef.current)) {
                commandBufferRef.current = "";
              }

              if (cleanTranscript.trim()) {
                if (cleanTranscript.toLowerCase().includes("tente") || cleanTranscript.toLowerCase().includes("again")) {
                  setAvatarState('correcting');
                } else {
                  setAvatarState('speaking');
                }
              }
            }
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const buffer = pcmToAudioBuffer(new Int16Array(base64ToArrayBuffer(audioData)), audioContextRef.current, 24000);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer; source.connect(audioContextRef.current.destination);
              const start = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(start); nextStartTimeRef.current = start + buffer.duration;
              sourceNodesRef.current.add(source);
              source.onended = () => { sourceNodesRef.current.delete(source); if (sourceNodesRef.current.size === 0) setAvatarState('idle'); };
            }
          },
          onclose: (e) => {
            console.log("SJLLive: WebSocket closed", e);
            setIsConnected(false);
            setIsConnecting(false);
            setAvatarState('idle');
            closeRef.current = true;
            isSetupCompleteRef.current = false;

            if (user && sessionPhrases.length > 0) {
              saveAIMemory({
                userId: user.uid,
                module: 'SJL',
                type: 'progress',
                content: `Sessão concluída no módulo ${appState.area} (${appState.level}). ${appState.stats.correctAttempts} acertos e ${appState.stats.errors} erros.`,
                metadata: { stats: appState.stats, level: appState.level, area: appState.area }
              });
            }
          },
          onerror: (e) => {
            console.error(e);
            closeRef.current = true;
            isSetupCompleteRef.current = false;
            setIsConnecting(false);
            setIsConnected(false);
            setAvatarState('idle');
          }
        }
      });
      sessionRef.current = session;
      processor.onaudioprocess = async (e) => {
        if (!isMuted && sessionRef.current && !closeRef.current && isSetupCompleteRef.current) {
          if (inputAudioContextRef.current?.state === 'suspended') {
            await inputAudioContextRef.current.resume();
          }

          const base64 = arrayBufferToBase64(float32ToInt16(e.inputBuffer.getChannelData(0)).buffer);
          try {
            sessionRef.current.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: base64 } });
          } catch (err) {
            console.log("WebSocket erro ao enviar áudio no SJL.");
          }
        }
      };
    } catch (e: any) {
      setIsConnecting(false);
      setAvatarState('idle');
      alert(e.message);
    }
  };

  const handleNextPhrase = () => {
    if (sessionRef.current && isPhraseApproved) {
      setIsPhraseApproved(false);
      setShowTranslation(false);
      // Enviar comando para a IA via texto se possível, ou apenas aguardar o próximo ciclo
      // Como o prompt já instrui a avançar, limpar o estado local é o mais importante
      try {
        sessionRef.current.send({ text: "Entendido, vamos para a próxima frase." });
      } catch (e) {
        console.log("Erro ao enviar comando de avanço manual.");
      }
    }
  };

  const handleEnd = () => {
    // Sincronização final para garantir aproveitamento do progresso parcial
    try {
      if (user) syncProgressToCloud(appState);
    } catch (e) { console.log("Erro na sincronização final", e); }

    try {
      cleanup();
    } catch (e) { console.log("Erro durante cleanup", e); }

    // Sempre chamar onClose para garantir que o componente seja desmontado
    onClose();
  };

  if (step === 'intro') return (
    <div className="fixed inset-0 bg-[#020617] z-[60] flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-4xl bg-slate-900 border border-slate-800 rounded-[3rem] p-12 text-center shadow-2xl">
        <h1 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter">SJL Neural Link <span className="text-blue-500">2.0</span></h1>
        <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto">Domine o Inglês Corporativo com a {instructorName}. {settings.sjl.welcomeMessage}</p>
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-emerald-400 font-bold mb-2 uppercase text-sm">Repetição Espaçada</h3>
            <p className="text-slate-500 text-xs">Foco no rigor de {settings.sjl.correctionCriteria}.</p>
          </div>
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-blue-400 font-bold mb-2 uppercase text-sm">IA Adaptativa</h3>
            <p className="text-slate-500 text-xs">Modelo: {settings.globalModel}.</p>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={() => setStep('dashboard')} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-3xl font-bold flex items-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95">Iniciar Treinamento <ArrowRight /></button>
          <button onClick={onClose} className="px-10 py-5 text-slate-500 hover:text-white font-bold">Talvez depois</button>
        </div>
      </div>
    </div>
  );

  if (step === 'dashboard') return (
    <div className="fixed inset-0 bg-[#020617] z-[60] overflow-y-auto p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-10">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">Currículo Personalizado</h2>
            <p className="text-sm text-slate-500">Progresso atual: {currentLevelProgress}%</p>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 bg-slate-900 rounded-xl md:rounded-2xl text-slate-500 hover:text-white"><X /></button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {['Iniciante', 'Básico', 'Intermediário'].map(lvl => (
            <button key={lvl} onClick={() => setAppState({ ...appState, level: lvl as any })} className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 transition-all ${appState.level === lvl ? 'bg-blue-600/10 border-blue-500 text-white shadow-2xl' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-1">{lvl}</span>
              <h4 className="text-lg md:text-2xl font-black">Level {lvl === 'Iniciante' ? '01' : lvl === 'Básico' ? '02' : '03'}</h4>
            </button>
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[3rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-8 md:gap-10">
            <div><p className="text-[10px] uppercase font-bold text-slate-600 mb-1">Módulo</p><p className="text-sm md:text-xl font-bold text-white uppercase">{appState.area}</p></div>
            <div><p className="text-[10px] uppercase font-bold text-slate-600 mb-1">Precisão</p><p className="text-sm md:text-xl font-bold text-emerald-500">{accuracyRate}%</p></div>
          </div>
          <button onClick={startSession} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 md:px-12 py-4 md:py-5 rounded-xl md:rounded-[2rem] font-black text-sm md:text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center md:justify-start gap-4">
            Conectar com ${instructorName} <Zap className="fill-current w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={isPopup
      ? "fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[calc(100%-2rem)] md:w-[400px] max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl z-[70] flex flex-col p-6 animate-fade-in"
      : "fixed inset-0 bg-[#020617] z-[60] flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden"}>
      <button
        onClick={handleEnd}
        className="absolute top-4 left-4 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-full text-white/40 hover:text-white transition-all z-[100]"
      >
        <X size={20} />
      </button>
      <InstructorAvatar state={avatarState} volume={volumeLevel} name={instructorName} isMini={isPopup} />
      <div className={`w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 flex flex-col items-center text-center ${isPopup ? 'mt-6 p-6 rounded-3xl' : 'mt-12 max-w-4xl rounded-[3rem] p-10'}`}>
        {activePhraseIndex >= 0 && activePhraseIndex < sessionPhrases.length ? (
          <div className="w-full space-y-8">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-blue-500 font-black uppercase tracking-widest text-[10px] md:text-sm bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                Lição {activePhraseIndex + 1} de {sessionPhrases.length}
              </span>
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2"
              >
                {showTranslation ? 'Ocultar Tradução' : 'Ver Tradução'}
              </button>
            </div>

            <div className={`bg-slate-950/50 border border-slate-800 shadow-inner relative overflow-hidden group ${isPopup ? 'rounded-2xl p-6 mb-4' : 'rounded-[2.5rem] p-10 md:p-16 mb-8'}`}>
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>

              <div className="flex flex-col items-center">
                <h2 className={`${isPopup ? 'text-2xl' : 'text-4xl md:text-6xl'} font-black text-white leading-tight break-words tracking-tighter`}>
                  {sessionPhrases[activePhraseIndex].english}
                </h2>

                <button
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(sessionPhrases[activePhraseIndex].english);
                    utterance.lang = 'en-US';
                    utterance.rate = 0.8;
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="mt-6 p-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full transition-all group-hover:scale-110 active:scale-95 border border-blue-500/20 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                >
                  <Volume2 className="w-5 h-5" /> Ouvir Guia
                </button>
              </div>

              <AnimatePresence>
                {showTranslation && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`italic text-slate-400 mt-4 border-t border-slate-800 pt-4 ${isPopup ? 'text-base' : 'text-xl md:text-2xl mt-8 pt-8'}`}
                  >
                    "{sessionPhrases[activePhraseIndex].portuguese}"
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className={`grid gap-4 w-full ${isPopup ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              <div className="bg-slate-800/20 border border-slate-800 rounded-3xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <BrainCircuit size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Status</p>
                  <p className={`text-sm font-bold ${isPhraseApproved ? 'text-emerald-400' : avatarState === 'correcting' ? 'text-amber-400' : 'text-blue-400'}`}>
                    {isPhraseApproved ? 'Pronúncia Aprovada!' : avatarState === 'correcting' ? 'Tente novamente...' : 'Aguardando sua fala...'}
                  </p>
                </div>
              </div>

              <button
                disabled={!isPhraseApproved}
                onClick={handleNextPhrase}
                className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl ${isPhraseApproved
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:scale-[1.02] active:scale-95'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
              >
                Próxima Frase <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : activePhraseIndex === -1 && isConnected ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-20">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Preparando sua Aula...</h3>
              <p className="text-slate-500 mt-2">Aguardando {instructorName} carregar as primeiras expressões.</p>
            </div>
          </div>
        ) : activePhraseIndex === 100 || activePhraseIndex === sessionPhrases.length ? (
          <div className="space-y-8">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6"><CheckCircle2 className="w-10 h-10" /></div>
            <h2 className="text-4xl font-black text-white uppercase">Sessão Concluída!</h2>
            <p className="text-slate-400">Excelente progresso. Relatório de desempenho gerado com sucesso.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={handleExportReport} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">Exportar PDF</button>
              <button onClick={handleEnd} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold">Voltar ao Hub</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-2xl font-medium text-slate-400">Aguardando conexão segura...</p>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>)}
            </div>
          </div>
        )}
      </div>
      <button onClick={handleEnd} className={`absolute ${isPopup ? 'top-4 right-4 w-10 h-10' : 'bottom-10 right-10 w-16 h-16'} bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-2xl group`}>
        {isPopup ? <X /> : <PhoneOff className="group-hover:rotate-12 transition-transform" />}
      </button>
    </div>
  );
};

export default SJLLiveConversation;
