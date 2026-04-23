
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SJLLiveConversation from './SJLLiveConversation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DuoModule, DuoLesson, DuoExercise, DuoUserProgress, DEFAULT_DUO_PROGRESS, Phrase,
    DuoTranslationExercise, DuoMultipleChoiceExercise, DuoFillInBlankExercise, DuoListenAndTypeExercise,
    EnglishLevel
} from '../types';
import DUO_MODULES from '../data/duolingoLessons';
import { loadDuoProgress, saveDuoProgress } from '../services/sjlProgressService';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { DuoSpeakExercise } from '../types';
import { SYLLABUS } from '../data/syllabus';
import {
    X, ChevronRight, Star, Zap, Flame, CheckCircle2, XCircle,
    Volume2, Keyboard, AlignLeft, HelpCircle, Home, Trophy, BookOpen, Mic, Bot, Briefcase, Heart
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

interface Props {
    onClose: () => void;
}

// ======================================================
// Utilitários
// ======================================================

const SJLNCharacter: React.FC<{ mood?: 'happy' | 'thinking' | 'talking' | 'neutral' | 'helping' }> = ({ mood = 'neutral' }) => {
    return (
        <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0 transition-transform duration-500">
            <div className={`absolute inset-0 bg-blue-500/10 rounded-full blur-xl ${mood === 'talking' || mood === 'helping' ? 'animate-pulse' : 'opacity-0'}`}></div>
            <div className="relative w-full h-full flex items-end justify-center">
                <img
                    src="/sjl_avatar.png"
                    alt="Sarah Jane"
                    className={`w-auto h-full object-contain transition-all duration-700 ${mood === 'talking' || mood === 'helping' ? 'scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'scale-100'}`}
                />
            </div>
        </div>
    );
};

const SpeechBubble: React.FC<{ children: React.ReactNode; isThinking?: boolean }> = ({ children, isThinking }) => {
    return (
        <div className="relative flex-1">
            <div className={`relative bg-slate-800 border-2 border-slate-700 p-4 md:p-6 rounded-[1.25rem] shadow-xl text-white ${isThinking ? 'border-dashed' : ''}`}>
                {children}
                {/* Arrow */}
                <div className="absolute top-8 -left-2 w-4 h-4 bg-slate-800 border-l-2 border-b-2 border-slate-700 -rotate-45" style={{ transformOrigin: 'center' }}></div>
            </div>
        </div>
    );
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; ring: string; shadow: string }> = {
    emerald: { bg: 'bg-[#58cc02]', border: 'border-[#46a302]', text: 'text-white', ring: 'ring-[#58cc02]', shadow: 'border-b-[#46a302]' },
    blue: { bg: 'bg-[#1cb0f6]', border: 'border-[#1899d6]', text: 'text-white', ring: 'ring-[#1cb0f6]', shadow: 'border-b-[#1899d6]' },
    dark: { bg: 'bg-[#37464f]', border: 'border-[#202f36]', text: 'text-slate-200', ring: 'ring-slate-700', shadow: 'border-b-[#202f36]' },
};

const FEEDBACK_CORRECT = ['Boa! ✅', 'Excelente! 🎉', 'Correto! 💪', 'Perfeito! ⭐', 'Mandou bem! 🔥', 'Incrível! 🎯'];
const FEEDBACK_WRONG = ['Não foi dessa vez.', 'Resposta incorreta.', 'Atenção ao detalhe!', 'Quase lá!'];

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(s: string) {
    return s.trim().toLowerCase().replace(/[.,!?;:'"-]/g, '').replace(/\s+/g, ' ');
}

// ======================================================
// Sub-componentes de exercícios
// ======================================================

// ---------- Tradução ----------
const TranslationExercise: React.FC<{
    ex: DuoTranslationExercise;
    onAnswer: (answer: string) => void;
    disabled: boolean;
    onPlayAudio: (text: string, lang?: string, audioUrl?: string) => void;
    onShowTip: () => void;
}> = ({ ex, onAnswer, disabled, onPlayAudio, onShowTip }) => {
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [bankState, setBankState] = useState<{ id: number; word: string; used: boolean }[]>(() =>
        ex.wordBank.map((w, i) => ({ id: i, word: w, used: false }))
    );

    useEffect(() => {
        setSelectedWords([]);
        setBankState(ex.wordBank.map((w, i) => ({ id: i, word: w, used: false })));
        onPlayAudio(ex.phrase, 'pt-BR');
    }, [ex.id]);

    const addWord = (idx: number) => {
        if (disabled || bankState[idx].used) return;
        setSelectedWords(prev => [...prev, bankState[idx].word]);
        setBankState(prev => prev.map((b, i) => i === idx ? { ...b, used: true } : b));
    };

    const removeWord = (wordIdx: number) => {
        if (disabled) return;
        const word = selectedWords[wordIdx];
        // Encontrar o PRIMEIRO token no banco que bate com essa palavra e está "usado"
        const bankMatch = bankState.find(b => b.word === word && b.used);
        if (bankMatch) {
            setBankState(prev => prev.map(b => b.id === bankMatch.id ? { ...b, used: false } : b));
        }
        setSelectedWords(prev => prev.filter((_, i) => i !== wordIdx));
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-32">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Traduza esta frase:</h2>

            <div className="flex items-start gap-3 mb-4">
                <SJLNCharacter mood={disabled ? 'neutral' : 'happy'} />
                <SpeechBubble>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onPlayAudio(ex.phrase, 'pt-BR')}
                                className="bg-[#1cb0f6] p-2 rounded-xl text-white hover:bg-[#1899d6] transition-colors"
                            >
                                <Volume2 className="w-6 h-6" />
                            </button>
                            <span className="text-xl font-medium border-b-2 border-dotted border-slate-500 pb-0.5 cursor-help">
                                {ex.phrase}
                            </span>
                        </div>
                        <button
                            onClick={onShowTip}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-yellow-400 transition-all border border-yellow-500/20 active:scale-95"
                            title="Dica da Sarah Jane"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                </SpeechBubble>
            </div>

            {/* Assembly Area with Lines */}
            <div className="min-h-[140px] flex flex-wrap gap-x-2 gap-y-4 items-start relative border-t-2 border-b-2 border-slate-800 py-6 px-2">
                {/* Horizontal lines in background */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                    <div className="flex-1 border-b border-slate-800"></div>
                    <div className="flex-1"></div>
                </div>

                <AnimatePresence>
                    {selectedWords.map((w, i) => (
                        <motion.button
                            key={`${w}-${i}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={() => removeWord(i)}
                            disabled={disabled}
                            className="bg-slate-800 border-2 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 text-white text-lg font-bold px-3 py-2 rounded-xl transition-all shadow-lg z-10"
                        >
                            {w}
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {/* Word Bank */}
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center mt-6 px-2">
                {bankState.map((b, i) => (
                    <button
                        key={b.id}
                        onClick={() => addWord(i)}
                        disabled={disabled || b.used}
                        className={`px-4 py-2.5 rounded-xl text-lg font-bold border-2 border-b-4 transition-all ${b.used
                            ? 'bg-slate-900 border-slate-800 text-transparent border-b-2 opacity-50'
                            : 'bg-slate-800 border-slate-700 active:border-b-0 active:translate-y-1 text-white hover:bg-slate-700'
                            }`}
                    >
                        {b.word}
                    </button>
                ))}
            </div>

            <VerifyFooter
                onVerify={() => onAnswer(selectedWords.join(' '))}
                disabled={disabled || selectedWords.length === 0}
            />
        </div>
    );
};

// ---------- Múltipla Escolha ----------
const MultipleChoiceExercise: React.FC<{
    ex: DuoMultipleChoiceExercise;
    onAnswer: (answer: string) => void;
    disabled: boolean;
    selectedAnswer?: string;
    onShowTip: () => void;
}> = ({ ex, onAnswer, disabled, selectedAnswer, onShowTip }) => {
    const [choice, setChoice] = useState<string | null>(null);

    useEffect(() => {
        setChoice(null);
    }, [ex.id]);

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-32">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Selecione a tradução correta:</h2>

            <div className="flex items-start gap-4 mb-4 mt-2">
                <SJLNCharacter mood={disabled ? 'neutral' : 'happy'} />
                <SpeechBubble>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xl md:text-2xl font-bold text-white leading-tight">{ex.question}</p>
                        <button
                            onClick={onShowTip}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-yellow-400 transition-all border border-yellow-500/20 active:scale-95 shrink-0"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                </SpeechBubble>
            </div>

            <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto w-full">
                {ex.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => !disabled && setChoice(opt)}
                        disabled={disabled}
                        className={`group relative flex items-center p-5 rounded-2xl border-2 border-b-4 transition-all text-left ${(choice === opt || selectedAnswer === opt)
                            ? 'bg-[#1cb0f6]/20 border-[#1cb0f6] border-b-[#1899d6] text-[#1cb0f6]'
                            : 'bg-slate-800 border-slate-700 border-b-slate-900 text-slate-200 hover:bg-slate-700'
                            } active:border-b-0 active:translate-y-1 shadow-lg`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm mr-4 transition-colors ${(choice === opt || selectedAnswer === opt) ? 'bg-[#1cb0f6] text-white' : 'bg-slate-700 text-slate-500'
                            }`}>
                            {i + 1}
                        </div>
                        <span className="text-lg font-bold">
                            {opt}
                        </span>
                    </button>
                ))}
            </div>

            <VerifyFooter
                onVerify={() => choice && onAnswer(choice)}
                disabled={disabled || !choice}
            />
        </div>
    );
};

// ---------- Completar a Frase ----------
const FillInBlankExercise: React.FC<{
    ex: DuoFillInBlankExercise;
    onAnswer: (answer: string) => void;
    disabled: boolean;
    onShowTip: () => void;
}> = ({ ex, onAnswer, disabled, onShowTip }) => {
    const [selection, setSelection] = useState<string | null>(null);
    const options = ex.options || (ex.correctAnswer ? [ex.correctAnswer] : []);

    const parts = ex.sentence.split('___');

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-32">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Complete o espaço vazio:</h2>

            <div className="flex items-start gap-4 mb-8">
                <SJLNCharacter mood={disabled ? 'neutral' : 'happy'} />
                <SpeechBubble>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xl md:text-2xl font-medium leading-relaxed">
                            <span>{parts[0]}</span>
                            <span className={`inline-flex min-w-[3rem] border-b-2 ${selection ? 'text-[#1cb0f6]' : 'border-slate-500'}`}>
                                {selection || '____'}
                            </span>
                            <span>{parts[1]}</span>
                        </div>
                        <button
                            onClick={onShowTip}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-yellow-400 transition-all border border-yellow-500/20 active:scale-95 shrink-0"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                </SpeechBubble>
            </div>

            <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
                {options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => !disabled && setSelection(opt)}
                        disabled={disabled}
                        className={`p-4 md:p-5 rounded-2xl border-2 border-b-4 transition-all text-lg font-bold ${selection === opt
                            ? 'bg-[#1cb0f6]/20 border-[#1cb0f6] border-b-[#1899d6] text-[#1cb0f6]'
                            : 'bg-slate-800 border-slate-700 border-b-slate-900 text-slate-200 hover:bg-slate-700'
                            } active:border-b-0 active:translate-y-1 shadow-lg`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            <VerifyFooter
                onVerify={() => selection && onAnswer(selection)}
                disabled={disabled || !selection}
            />
        </div>
    );
};

const VerifyFooter: React.FC<{ onVerify: () => void; disabled: boolean }> = ({ onVerify, disabled }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#020617] border-t border-slate-800 flex justify-center z-40">
            <button
                onClick={onVerify}
                disabled={disabled}
                className={`w-full max-w-2xl py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:translate-y-1 active:border-b-0 border-b-4 shadow-xl ${disabled
                    ? 'bg-[#37464f] border-b-[#202f36] text-slate-500 cursor-not-allowed'
                    : 'bg-[#58cc02] border-b-[#46a302] text-white hover:bg-[#61da04]'
                    }`}
            >
                Verificar
            </button>
        </div>
    );
};

// ---------- Ouça e Escreva ----------
const ListenAndTypeExercise: React.FC<{
    ex: DuoListenAndTypeExercise;
    onAnswer: (answer: string) => void;
    disabled: boolean;
    onPlayAudio: (text: string, lang?: string, audioUrl?: string) => void;
    onShowTip: () => void;
}> = ({ ex, onAnswer, disabled, onPlayAudio, onShowTip }) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setValue('');
        onPlayAudio(ex.audioText, 'en-US', ex.audioUrl);
    }, [ex.id]);

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in pb-32">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Escreva o que você ouve:</h2>

            <div className="flex items-start gap-4 mb-4">
                <SJLNCharacter mood={disabled ? 'neutral' : 'happy'} />
                <SpeechBubble>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onPlayAudio(ex.audioText, 'en-US', ex.audioUrl)}
                                className="bg-[#1cb0f6] p-4 rounded-2xl text-white hover:bg-[#1899d6] transition-all shadow-[0_4px_0_#1899d6] active:shadow-none active:translate-y-1"
                            >
                                <Volume2 className="w-8 h-8" />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Toque para ouvir</span>
                            </div>
                        </div>
                        <button
                            onClick={onShowTip}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-yellow-400 transition-all border border-yellow-500/20 active:scale-95 shrink-0"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                </SpeechBubble>
            </div>

            <div className="relative">
                <textarea
                    ref={inputRef}
                    autoFocus
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="Digite em inglês..."
                    className="w-full h-48 bg-[#131f24] border-2 border-slate-700 focus:border-[#1cb0f6] rounded-[2rem] p-6 text-white text-xl font-medium outline-none resize-none transition-all placeholder:text-slate-700"
                    disabled={disabled}
                />

                <button
                    className="mt-4 flex items-center gap-2 text-[#1cb0f6] font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity"
                    onClick={() => {/* Mock speaking */ }}
                >
                    <Mic className="w-4 h-4" /> Toque para falar
                </button>
            </div>

            <VerifyFooter
                onVerify={() => onAnswer(value)}
                disabled={disabled || !value.trim()}
            />
        </div>
    );
};

// ---------- Falar (Speech-to-Text) ----------
const SpeakExercise: React.FC<{
    ex: DuoSpeakExercise;
    onAnswer: (answer: string) => void;
    disabled: boolean;
    onPlayAudio: (text: string, lang?: string, audioUrl?: string) => void;
    onShowTip: () => void;
}> = ({ ex, onAnswer, disabled, onPlayAudio, onShowTip }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        onPlayAudio(ex.phraseToSpeak, 'en-US', ex.audioUrl);

        let recognition: any = null;
        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    const text = event.results[0][0].transcript;
                    setTranscript(text);
                    setIsListening(false);
                    setTimeout(() => onAnswer(text), 1000);
                };

                recognition.onerror = (event: any) => {
                    console.warn("SpeechRecognition timeout ou erro. Código:", event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            } else {
                console.warn("SpeechRecognition não suportado neste navegador.");
            }
        } catch (err) {
            console.error("Erro na inicialização do SpeechRecognition:", err);
        }

        // Cleanup
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) { }
            }
        };
    }, [onAnswer, ex.phraseToSpeak, ex.audioUrl, onPlayAudio]);

    const startListening = () => {
        if (disabled || isListening) return;
        setTranscript('');

        if (!recognitionRef.current) {
            alert('A gravação de voz não é suportada ou foi bloqueada pelo seu navegador. Use o Chrome ou Edge e conceda as permissões de microfone.');
            // Alternativa para prosseguir em navegadores não suportados
            const mockAnswer = prompt("A gravação falhou. Digite manualmente o que você falou para validar:");
            if (mockAnswer) onAnswer(mockAnswer);
            return;
        }

        setIsListening(true);
        try {
            recognitionRef.current.start();
        } catch (e: any) {
            console.warn("Tentativa de start() no microfone falhou:", e);
            if (e.name === 'InvalidStateError') {
                // Estava ouvindo "invisivelmente" e não despachou evento. Força abortar e tentar dinovo.
                try {
                    recognitionRef.current.abort();
                    setTimeout(() => recognitionRef.current.start(), 200);
                } catch (err) { setIsListening(false); }
            } else {
                setIsListening(false);
                alert('Erro ao acessar o microfone. Verifique as permissões da página.');
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in items-center text-center pb-32">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 self-start">Repita o que a Sarah Jane disse:</h2>

            <div className="flex items-start gap-4 mb-4 w-full">
                <SJLNCharacter mood={isListening ? 'talking' : 'happy'} />
                <SpeechBubble>
                    <div className="flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onPlayAudio(ex.phraseToSpeak, 'en-US', ex.audioUrl)}
                                className="bg-[#1cb0f6] p-2 rounded-xl text-white hover:bg-[#1899d6] transition-colors"
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                            <span className="text-xl font-medium">
                                {ex.phraseToSpeak}
                            </span>
                        </div>
                        <button
                            onClick={onShowTip}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-yellow-400 transition-all border border-yellow-500/20 active:scale-95 shrink-0"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                </SpeechBubble>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-12">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={startListening}
                    disabled={disabled || isListening}
                    className="w-24 h-24 md:w-32 md:h-32 bg-[#1cb0f6] border-b-[6px] border-[#1899d6] rounded-3xl flex items-center justify-center text-white shadow-xl active:border-b-0 active:translate-y-1 transition-all"
                >
                    {isListening ? (
                        <div className="flex gap-1 items-end h-8">
                            {[1, 2, 3, 2, 1].map((h, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [12, 32, 12] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                    className="w-1.5 bg-white rounded-full"
                                />
                            ))}
                        </div>
                    ) : (
                        <Mic className="w-12 h-12 md:w-16 md:h-16" />
                    )}
                </motion.button>

                {transcript && (
                    <p className="mt-8 text-[#1cb0f6] font-bold text-lg italic">"{transcript}"</p>
                )}
            </div>

            <button
                className="text-slate-500 font-black uppercase tracking-widest text-sm hover:text-slate-400 transition-colors mt-4"
                onClick={() => onAnswer(ex.phraseToSpeak)} // Skip for now
            >
                Não posso falar agora
            </button>

            <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center z-40">
                {/* No footer button needed here as per image, but for logic we might want one after recording */}
            </div>
        </div>
    );
};

// ======================================================
// Tela de Feedback (overlay animado)
// ======================================================
const FeedbackOverlay: React.FC<{
    isCorrect: boolean;
    message: string;
    correctAnswer: string;
    explanation?: string;
    xpEarned: number;
    onContinue: () => void;
}> = ({ isCorrect, message, correctAnswer, explanation, xpEarned, onContinue }) => (
    <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={!isCorrect ? { opacity: 1, y: 0, x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={!isCorrect ? { delay: 0, x: { duration: 0.4, repeat: 0 } } : {}}
        className={`fixed bottom-0 left-0 right-0 z-50 px-6 pb-10 pt-8 backdrop-blur-2xl border-t-4 shadow-2xl ${isCorrect
            ? 'bg-emerald-900/95 border-emerald-500 shadow-emerald-950/50'
            : 'bg-rose-950/95 border-rose-500 shadow-rose-950/50'
            }`}
    >
        <div className="max-w-xl mx-auto flex flex-col items-center gap-6">
            <div className="flex items-start gap-5 w-full">
                <div className={`p-3 rounded-2xl ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {isCorrect ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                </div>
                <div className="flex-1">
                    <p className={`text-2xl font-black ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>{message}</p>
                    {!isCorrect && (
                        <div className="mt-2 text-rose-200/80">
                            <p className="text-xs font-black uppercase tracking-widest opacity-60">Resposta correta:</p>
                            <p className="text-lg font-bold">{correctAnswer}</p>
                        </div>
                    )}
                    {explanation && (
                        <p className={`text-sm mt-3 py-2 px-3 rounded-xl ${isCorrect ? 'bg-emerald-500/10 text-emerald-200/70' : 'bg-rose-500/10 text-rose-200/70'} italic`}>
                            "{explanation}"
                        </p>
                    )}
                </div>
                {isCorrect && (
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 rounded-2xl px-4 py-2"
                    >
                        <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xl font-black text-yellow-400">+{xpEarned}</span>
                    </motion.div>
                )}
            </div>

            <button
                onClick={onContinue}
                className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all active:translate-y-1 active:border-b-0 border-b-4 border-black/20 shadow-xl ${isCorrect
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                    }`}
            >
                Continuar
            </button>
        </div>
    </motion.div>
);

const TipOverlay: React.FC<{ text: string, onClose: () => void }> = ({ text, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-900 border-2 border-yellow-500/50 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative"
        >
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                <X size={24} />
            </button>
            <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500">
                    <HelpCircle size={40} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2 underline decoration-yellow-500 decoration-2 underline-offset-4">Dica da Sarah Jane</h3>
                    <p className="text-slate-300 leading-relaxed italic">"{text}"</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-2xl transition-all active:scale-95"
                >
                    Entendido!
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ======================================================
// Tela de Conclusão de Lição
// ======================================================
const LessonCompleteScreen: React.FC<{
    lesson: DuoLesson;
    correct: number;
    total: number;
    xpEarned: number;
    onBack: () => void;
    onNextLesson: () => void;
    hasNextLesson: boolean;
    accuracy: number;
    timeInSeconds: number;
}> = ({ lesson, correct, total, xpEarned, onBack, onNextLesson, hasNextLesson, accuracy, timeInSeconds }) => {
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

    return (
        <div className="fixed inset-0 bg-[#020617] z-[70] flex flex-col items-center justify-center p-6 sm:p-10 animate-fade-in overflow-y-auto">
            <div className="max-w-2xl w-full text-center space-y-12 py-10">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="relative inline-block"
                >
                    <div className="w-40 h-40 mx-auto bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[3rem] p-1 shadow-2xl shadow-blue-500/20">
                        <div className="w-full h-full bg-[#020617] rounded-[2.8rem] flex items-center justify-center overflow-hidden">
                            <SJLNCharacter mood="happy" />
                        </div>
                    </div>
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-6 -right-6 bg-yellow-500 text-black font-black px-4 py-2 rounded-2xl shadow-xl border-4 border-[#020617] text-xl"
                    >
                        +{xpEarned} XP
                    </motion.div>
                </motion.div>

                <div className="space-y-4">
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic italic underline decoration-blue-500">Lição Concluída!</h2>
                    <div className="flex justify-center gap-4">
                        {[1, 2, 3].map(s => (
                            <motion.div
                                key={s}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + (s * 0.1) }}
                            >
                                <Star
                                    className={`w-12 h-12 ${s <= stars ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'text-slate-800 fill-slate-800'}`}
                                />
                            </motion.div>
                        ))}
                    </div>
                    <p className="text-slate-500 text-lg">Excelente trabalho! Você está dominando este dialeto tecnológico.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 text-center">Precisão Neural</p>
                        <p className="text-4xl font-black text-emerald-500">{Math.round(accuracy)}%</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 text-center">Tempo de Treino</p>
                        <p className="text-4xl font-black text-blue-500">{timeInSeconds}s</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {hasNextLesson && (
                        <button
                            onClick={onNextLesson}
                            className="flex-2 bg-blue-600 hover:bg-blue-500 text-white py-6 px-12 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40"
                        >
                            Próxima Lição
                        </button>
                    )}
                    <button
                        onClick={onBack}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-6 rounded-3xl font-black uppercase tracking-widest transition-all"
                    >
                        Voltar ao Menu
                    </button>
                </div>
            </div>
        </div>
    );
};

// ======================================================
// Tela do Hub de Módulos
// ======================================================
const ModuleHub: React.FC<{
    progress: DuoUserProgress;
    onStartLesson: (lesson: DuoLesson, moduleTitle: string, moduleId: string) => void;
    onClose: () => void;
    onShowAIChat: () => void;
}> = ({ progress, onStartLesson, onClose, onShowAIChat }) => {
    const [selectedLevel, setSelectedLevel] = useState<EnglishLevel>('Iniciante');
    const [selectedModule, setSelectedModule] = useState<{ id: string, name: string, order?: number } | null>(null);
    const [dbModules, setDbModules] = useState<{ id: string, name: string, order?: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchModules = async () => {
            setIsLoading(true);
            try {
                const snap = await getDocs(collection(db, 'modules'));
                // Vamos assumir que os modulos do BD vem num formato padrão, mapeamos:
                const mods = snap.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.name || 'Sem nome',
                        order: data.order || 0
                    };
                });
                // Ordenar por order, se existir
                mods.sort((a, b) => (a.order || 0) - (b.order || 0));
                setDbModules(mods);
            } catch (error) {
                console.error("Erro ao buscar módulos:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchModules();
    }, []);

    const levels: EnglishLevel[] = ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Executivo'];

    const getLessonStatus = (lessonId: string): 'completed' | 'current' | 'locked' => {
        if (progress.completedLessons.includes(lessonId)) return 'completed';
        if (lessonId === progress.currentLessonId) return 'current';
        return 'locked';
    };

    const getModuleProgress = (modId: string) => {
        const total = 5; // Aderindo as 5 lições virtuais no render por nível
        const done = progress.completedLessons.filter(l => l.startsWith(`${modId}_${selectedLevel}_`)).length;
        return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    };

    const accuracyLabel = progress.statistics.totalExercises > 0
        ? Math.round((progress.statistics.correctAnswers / progress.statistics.totalExercises) * 100)
        : 0;

    if (selectedModule) {
        const colors = COLOR_MAP.blue; // Cor padrão, já que o DB pode não ter as cores

        // Vamos gerar lições virtuais (ex: 5 lições por módulo) para o usuário clicar
        const virtualLessons: DuoLesson[] = Array.from({ length: 5 }).map((_, idx) => ({
            id: `${selectedModule.id}_${selectedLevel}_l${idx + 1}`,
            moduleId: selectedModule.id,
            title: `Lição ${idx + 1}`,
            description: `Prática de nível ${selectedLevel}`,
            order: idx + 1,
            exercises: [] // preenchidos na hora
        }));

        return (
            <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
                <button onClick={() => setSelectedModule(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-semibold">
                    <Home className="w-4 h-4" /> Módulos
                </button>

                <div className={`${colors.bg} ${colors.border} border rounded-2xl p-5 mb-6`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl text-blue-400"><Briefcase className="w-8 h-8" /></span>
                        <div>
                            <h2 className={`text-xl font-black ${colors.text}`}>{selectedModule.name}</h2>
                            <p className="text-sm text-slate-400">Nível: {selectedLevel}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {virtualLessons.map((lesson, idx) => {
                        const status = getLessonStatus(lesson.id);
                        // A primeira sempre é destravada. As outras requerem a anterior feita.
                        // Mas para simplificar o teste livre, vamos travar se a primeira lição geral estiver vazia (?)
                        const isLocked = status === 'locked' && idx > 0 && !progress.completedLessons.includes(virtualLessons[idx - 1].id);

                        return (
                            <motion.button
                                key={lesson.id}
                                whileHover={!isLocked ? { x: 4 } : undefined}
                                onClick={() => !isLocked && onStartLesson({ ...lesson, title: `${selectedModule.name} - ${lesson.title}` }, selectedModule.name, selectedModule.id)}
                                disabled={isLocked}
                                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${status === 'completed'
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                    : status === 'current'
                                        ? `${colors.bg} ${colors.border} text-white`
                                        : isLocked
                                            ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                            : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black ${status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : `${colors.bg} ${colors.text}`
                                    }`}>
                                    {status === 'completed' ? '✓' : idx + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">{lesson.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Dinâmico</p>
                                </div>
                                {status === 'current' && (
                                    <span className={`text-xs font-bold uppercase tracking-widest ${colors.text} bg-current/10 px-2 py-1 rounded-lg`} style={{ backgroundColor: 'rgba(var(--tw-bg-opacity,1), 0.1)' }}>
                                        Iniciar
                                    </span>
                                )}
                                {!isLocked && <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">SJL Neural Link</h1>
                    <p className="text-sm text-slate-500">Modo Interativo · Duolingo-Style</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onShowAIChat}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-xl hover:bg-purple-500/30 transition-colors text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-900/20 active:scale-95"
                    >
                        <Bot className="w-4 h-4" />
                        Falar com IA
                    </button>
                    <button onClick={onClose} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-500 flex-shrink-0" />
                    <div>
                        <p className="text-xl font-black text-white">{progress.streakDays}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Streak</p>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    <div>
                        <p className="text-xl font-black text-white">{progress.totalXP}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">XP Total</p>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div>
                        <p className="text-xl font-black text-white">{accuracyLabel}%</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Precisão</p>
                    </div>
                </div>
            </div>

            {/* Nível Seletor */}
            <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Nível de Dificuldade</h2>
                <div className="flex flex-wrap gap-2">
                    {levels.map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setSelectedLevel(lvl)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedLevel === lvl ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Módulos do Firebase */}
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Áreas Corporativas</h2>
            {isLoading ? (
                <div className="text-slate-400 text-center py-10 font-bold">Carregando dados da nuvem...</div>
            ) : dbModules.length === 0 ? (
                <div className="text-slate-400 text-center py-10">Nenhum módulo encontrado no Firebase. Verifique se foram carregados.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dbModules.map(mod => {
                        const { done, total, pct } = getModuleProgress(mod.id);

                        return (
                            <motion.button
                                key={mod.id}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedModule(mod)}
                                className={`p-5 rounded-2xl border text-left transition-all space-y-3 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 shadow-lg`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl text-blue-400"><Briefcase className="w-6 h-6" /></span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-black text-base text-blue-400`}>{mod.name}</p>
                                        <p className="text-xs text-slate-500 truncate">Gerado a partir do Banco de Dados</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-1">
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.6, delay: 0.2 }}
                                            className={`h-full rounded-full bg-blue-500`}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-semibold">{done} feitas</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ======================================================
// Componente Principal — SJLDuolingoMode
// ======================================================
const SJLDuolingoMode: React.FC<Props> = ({ onClose }) => {
    const { user } = useAuth();
    const { showToast } = useNotifications();

    const [screen, setScreen] = useState<'hub' | 'lesson' | 'complete'>('hub');
    const [progress, setProgress] = useState<DuoUserProgress>({ ...DEFAULT_DUO_PROGRESS });
    const [currentLesson, setCurrentLesson] = useState<DuoLesson | null>(null);
    const [exerciseIndex, setExerciseIndex] = useState(0);
    const [feedback, setFeedback] = useState<{
        isCorrect: boolean;
        message: string;
        correctAnswer: string;
        explanation?: string;
        xpEarned: number;
        selectedAnswer?: string;
    } | null>(null);
    const [lessonStats, setLessonStats] = useState({ correct: 0, xpEarned: 0 });
    const [wrongAnswers, setWrongAnswers] = useState<DuoExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAIChat, setShowAIChat] = useState(false);
    const [tip, setTip] = useState<{ text: string, visible: boolean }>({ text: '', visible: false });
    const [hearts, setHearts] = useState(5); // Sistema de vidas estilo Duolingo
    const MAX_HEARTS = 5;

    // --- Audio Queue Management ---
    const audioQueueRef = useRef<{ text: string, lang: string, audioUrl?: string }[]>([]);
    const isSpeakingRef = useRef(false);

    const processAudioQueue = useCallback(() => {
        if (isSpeakingRef.current || audioQueueRef.current.length === 0) return;

        isSpeakingRef.current = true;
        const item = audioQueueRef.current.shift()!;

        if (item.audioUrl) {
            const audio = new Audio(item.audioUrl);
            audio.onended = () => {
                isSpeakingRef.current = false;
                processAudioQueue();
            };
            audio.onerror = () => {
                console.warn('Audio URL falhou, tentando TTS. url:', item.audioUrl);
                // Fallback to TTS if Audio URL fails
                playTTS(item.text, item.lang);
            };
            audio.play().catch(e => {
                console.warn('Audio URL playback falhou:', e);
                // Fallback imediato se bloquado
                playTTS(item.text, item.lang);
            });
            return;
        }

        playTTS(item.text, item.lang);

        function playTTS(text: string, lang?: string) {
            try {
                if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                    window.speechSynthesis.cancel();
                }

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = lang || 'en-US';
                utterance.rate = lang === 'pt-BR' ? 1.0 : 0.82;
                utterance.pitch = lang === 'pt-BR' ? 1.0 : 1.05;
                utterance.volume = 1.0;

                // Tentar selecionar voz feminina disponível para inglês
                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v => v.lang.startsWith(lang === 'pt-BR' ? 'pt' : 'en') && v.name.toLowerCase().includes('female'))
                    || voices.find(v => v.lang.startsWith(lang === 'pt-BR' ? 'pt' : 'en') && (v.name.includes('Google') || v.name.includes('Microsoft')))
                    || voices.find(v => v.lang.startsWith(lang === 'pt-BR' ? 'pt' : 'en'));
                if (preferredVoice) utterance.voice = preferredVoice;

                // Garante limpeza de trava
                const unlock = () => {
                    isSpeakingRef.current = false;
                    processAudioQueue();
                };

                utterance.onend = unlock;
                utterance.onerror = (e) => {
                    console.warn("TTS Error", e);
                    unlock();
                };

                window.speechSynthesis.speak(utterance);

                // Fallback rigoroso (bug do Chromium em que o evento end nunca triga)
                setTimeout(() => {
                    if (isSpeakingRef.current) {
                        console.warn("Forçando liberação da fila do TTS (Chromium bug)");
                        window.speechSynthesis.cancel();
                        unlock();
                    }
                }, Math.max(3000, text.length * 100));

            } catch (err) {
                console.error("Erro critico na inicialização do TTS:", err);
                isSpeakingRef.current = false;
                processAudioQueue();
            }
        }
    }, []);

    const handlePlayAudio = useCallback((text: string, lang: string = 'en-US', audioUrl?: string) => {
        if (audioQueueRef.current.some(item => item.text === text && item.lang === lang)) return;
        audioQueueRef.current.push({ text, lang, audioUrl });
        processAudioQueue();
    }, [processAudioQueue]);

    const handleShowTip = useCallback(() => {
        if (!currentLesson) return;
        const exercise = currentLesson.exercises[exerciseIndex];
        if (!exercise) return;

        let tipText = "Sarah Jane está analisando...";
        if (exercise.hint) {
            tipText = exercise.hint;
        } else if (exercise.type === 'translation' || exercise.type === 'listen_and_type') {
            const corr = (exercise as any).correctAnswer || (exercise as any).phrase || (exercise as any).audioText;
            const words = (corr || "").split(' ');
            tipText = `Dica: Esta frase começa com "${words[0]}".`;
        }
        setTip({ text: tipText, visible: true });
        setTimeout(() => handlePlayAudio("I have a tip for you.", "en-US"), 300);
    }, [currentLesson, exerciseIndex, handlePlayAudio]);


    // Carregar progresso ao montar
    useEffect(() => {
        (async () => {
            try {
                const saved = await loadDuoProgress(user?.uid);
                setProgress(saved);
            } catch (e) {
                console.warn('Erro ao carregar progresso:', e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user?.uid]);

    // Salvar progresso ao atualizar (debounced)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (isLoading) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            await saveDuoProgress(progress, user?.uid);
        }, 800);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [progress, user?.uid, isLoading]);

    const handleStartLesson = useCallback(async (lesson: DuoLesson, moduleTitleFromHub: string, moduleIdFromHub: string) => {
        setIsLoading(true);
        let injectedLesson = { ...lesson };

        // Pelo Hub gerado dinamicamente, o ID da lição que nós fabricamos
        // vem no formato: moduleID_Level_l1
        const fragments = lesson.id.split('_');
        const levelName = fragments[1] as EnglishLevel || 'Iniciante';
        const moduleId = fragments[0] || moduleIdFromHub;
        const moduleTitle = DUO_MODULES.find(m => m.id === moduleId)?.title || moduleTitleFromHub || 'Gestão';

        try {
            // Tenta puxar as frases da coleção "phrases" com o Módulo e Nível originais do Firebase
            const q = query(
                collection(db, 'phrases'),
                where('moduleId', '==', moduleId),
                where('level', '==', levelName)
            );
            const snap = await getDocs(q);

            // Selecionamos as frases do nível, sorteamos as que entrarão na lição.
            let fetchedPhrases = snap.docs.map(d => d.data() as Phrase);

            // Fallback para frases locais se o Firestore retornar vazio
            if (fetchedPhrases.length === 0) {
                console.log("SJL: Cloud vazio, tentando fallback local...");
                fetchedPhrases = SYLLABUS[levelName]?.[moduleTitle] || [];
            }

            if (fetchedPhrases.length > 0) {
                const mappedExercises: DuoExercise[] = fetchedPhrases.slice(0, 10).map((p, i): DuoExercise => {
                    const baseId = `dyn_ex_${i}_${p.id || Date.now()}`;
                    const rand = Math.random();

                    // Função helper para pegar distractors reais do pool de frases
                    const getDistractors = (correctPhrase: Phrase, count: number) => {
                        const isWordType = correctPhrase.type === 'word' || (!correctPhrase.type && correctPhrase.english.split(' ').length <= 2);
                        return fetchedPhrases
                            .filter(f => {
                                if (f.english === correctPhrase.english) return false;
                                const fIsWord = f.type === 'word' || (!f.type && f.english.split(' ').length <= 2);
                                return fIsWord === isWordType;
                            })
                            .map(f => f.english)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, count);
                    };

                    const baseExercise = {
                        id: baseId,
                        xpValue: 10,
                        context: p.context || p.portuguese,
                        audioUrl: p.audio_url
                    };

                    // 1) 25% chance de Translation (Sempre PT -> EN)
                    if (rand < 0.25) {
                        const distractors = getDistractors(p, 4);
                        return {
                            ...baseExercise,
                            type: 'translation',
                            direction: 'pt_to_en',
                            phrase: p.portuguese,
                            correctAnswer: p.english,
                            wordBank: p.english.split(' ')
                                .concat(distractors.flatMap(d => d.split(' ')).slice(0, 5))
                                .sort(() => 0.5 - Math.random()),
                            hint: `Traduza: "${p.portuguese}"`
                        };
                    }
                    // 2) 20% chance Multiple Choice
                    else if (rand < 0.45) {
                        const distractors = getDistractors(p, 3);
                        // Se não houver frases suficientes para distractors, usa fallbacks melhores
                        const finalOptions = [p.english, ...distractors];
                        while (finalOptions.length < 4) finalOptions.push(`Option ${finalOptions.length + 1} backup`);

                        return {
                            ...baseExercise,
                            type: 'multiple_choice',
                            question: `Como se diz: "${p.portuguese}" em inglês?`,
                            options: finalOptions.sort(() => 0.5 - Math.random()),
                            correct: p.english,
                            explanation: `A tradução correta é: ${p.english}`,
                            xpValue: 12,
                            hint: `Escolha a tradução de: ${p.portuguese}`
                        };
                    }
                    // 3) 20% Fill in blank
                    else if (rand < 0.65) {
                        const words = p.english.split(' ');
                        let hiddenIdx = words.length > 2 ? Math.floor(words.length / 2) : 0;
                        let hiddenWord = words[hiddenIdx] || words[0];
                        const sentenceWithPlaceholder = words.map((w, i) => i === hiddenIdx ? '___' : w).join(' ');

                        const distractors = fetchedPhrases
                            .flatMap(f => f.english.split(' '))
                            .filter(w => w !== hiddenWord && w.length > 2)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 2);

                        return {
                            ...baseExercise,
                            type: 'fill_in_blank',
                            sentence: sentenceWithPlaceholder,
                            correctAnswer: hiddenWord,
                            options: [hiddenWord, ...distractors].sort(() => 0.5 - Math.random()),
                            context: p.portuguese,
                            xpValue: 15,
                            hint: `Complete a lacuna da tradução para: ${p.portuguese}`
                        };
                    }
                    // 4) 15% Listen and type
                    else if (rand < 0.8) {
                        return {
                            ...baseExercise,
                            type: 'listen_and_type',
                            audioText: p.english,
                            correctAnswer: p.english,
                            hint: `Ouça o áudio e digite o que entendeu (Dica: ${p.portuguese})`,
                            xpValue: 20
                        };
                    }
                    // 5) 20% Speak
                    else {
                        return {
                            ...baseExercise,
                            type: 'speak',
                            phraseToSpeak: p.english,
                            translation: p.portuguese,
                            correctAnswer: p.english,
                            xpValue: 25,
                            hint: `Fale a frase: ${p.english}`
                        };
                    }
                });

                if (mappedExercises.length > 0) {
                    injectedLesson.exercises = mappedExercises;
                }
            }
        } catch (e) {
            console.warn('Erro ao carregar frases:', e);
            // Fallback imediato se falhar o Firebase
            const localFallback = SYLLABUS[levelName]?.[moduleTitle] || [];
            if (localFallback.length > 0 && injectedLesson.exercises.length === 0) {
                // Aqui poderíamos ter um mapeamento local redundante, mas por enquanto logamos
                console.log("SJL: Usando frases locais após erro.");
            }
        }

        setCurrentLesson(injectedLesson);
        setExerciseIndex(0);
        setFeedback(null);
        setWrongAnswers([]);
        setLessonStats({ correct: 0, xpEarned: 0 });
        setHearts(MAX_HEARTS); // Reset vidas por lição
        setScreen('lesson');

        setProgress(prev => ({ ...prev, currentLessonId: lesson.id }));
        setIsLoading(false);
    }, [progress, setProgress, showToast]);

    const handleAnswer = useCallback((answer: string) => {
        if (!currentLesson || feedback) return;
        const ex = currentLesson.exercises[exerciseIndex];
        if (!ex) return;

        let isCorrect = false;
        let explanation: string | undefined;
        let correctAnswer = '';

        if (ex.type === 'translation') {
            correctAnswer = ex.correctAnswer;
            isCorrect = normalize(answer) === normalize(ex.correctAnswer);
        } else if (ex.type === 'multiple_choice') {
            correctAnswer = ex.correct;
            isCorrect = answer === ex.correct;
            explanation = ex.explanation;
        } else if (ex.type === 'fill_in_blank') {
            correctAnswer = ex.correctAnswer;
            isCorrect = normalize(answer) === normalize(ex.correctAnswer);
            if (ex.context) explanation = ex.context;
        } else if (ex.type === 'listen_and_type') {
            correctAnswer = ex.correctAnswer;
            isCorrect = normalize(answer) === normalize(ex.correctAnswer);
        } else if (ex.type === 'speak') {
            correctAnswer = ex.correctAnswer;
            isCorrect = normalize(answer) === normalize(ex.correctAnswer);
            if (ex.translation) explanation = ex.translation;
        }

        const xp = isCorrect ? ex.xpValue : 0;
        const feedbackMsg = isCorrect ? randomFrom(FEEDBACK_CORRECT) : randomFrom(FEEDBACK_WRONG);

        setFeedback({ isCorrect, message: feedbackMsg, correctAnswer, explanation, xpEarned: xp, selectedAnswer: answer });

        if (isCorrect) {
            // Som de acerto
            try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine'; osc.frequency.value = 880; gain.gain.value = 0.15;
                osc.start(); osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.stop(ctx.currentTime + 0.3);
            } catch (e) { /* audio feedback optional */ }

            handlePlayAudio(correctAnswer, 'en-US', ex.audioUrl);
            setLessonStats(s => ({ correct: s.correct + 1, xpEarned: s.xpEarned + xp }));
            setProgress(prev => ({
                ...prev,
                totalXP: prev.totalXP + xp,
                statistics: {
                    ...prev.statistics,
                    totalExercises: prev.statistics.totalExercises + 1,
                    correctAnswers: prev.statistics.correctAnswers + 1,
                },
            }));
            if (xp >= 15) showToast(`+${xp} XP — Resposta perfeita!`, 'success');
        } else {
            setProgress(prev => ({
                ...prev,
                statistics: {
                    ...prev.statistics,
                    totalExercises: prev.statistics.totalExercises + 1,
                },
            }));
            setWrongAnswers(prev => [...prev, ex]);

            // Som de erro
            try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sawtooth'; osc.frequency.value = 220; gain.gain.value = 0.1;
                osc.start(); osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.stop(ctx.currentTime + 0.4);
            } catch (e) { /* audio feedback optional */ }

            // Perder um coração
            setHearts(prev => {
                const newHearts = Math.max(0, prev - 1);
                if (newHearts === 0) {
                    showToast('💔 Sem vidas! Tente novamente.', 'error');
                }
                return newHearts;
            });
        }
    }, [currentLesson, exerciseIndex, feedback, setProgress, showToast, setHearts, setWrongAnswers, setLessonStats, handlePlayAudio]);

    const handleContinue = useCallback(() => {
        if (!currentLesson) return;
        setFeedback(null);

        const nextIndex = exerciseIndex + 1;
        if (nextIndex >= currentLesson.exercises.length) {
            if (wrongAnswers.length > 0) {
                // Adiciona as questões erradas no final da lição para servir de revisão imediata
                setCurrentLesson(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        exercises: [...prev.exercises, ...wrongAnswers]
                    };
                });
                setExerciseIndex(nextIndex);
                setWrongAnswers([]);
                showToast('Atenção: Hora da revisão dos seus erros!', 'info');
            } else {
                // Lição concluída totalmente sem erros pendentes
                if (!progress.completedLessons.includes(currentLesson.id)) {
                    setProgress(prev => ({
                        ...prev,
                        completedLessons: [...prev.completedLessons, currentLesson.id],
                        statistics: { ...prev.statistics, totalSessions: prev.statistics.totalSessions + 1 },
                    }));
                    showToast(`Lição "${currentLesson.title}" concluída! 🎉`, 'success');
                }
                setScreen('complete');
            }
        } else {
            setExerciseIndex(nextIndex);
        }
    }, [currentLesson, exerciseIndex, wrongAnswers, progress.completedLessons, setProgress, setExerciseIndex, setCurrentLesson, setWrongAnswers, showToast]);

    const handleNextLesson = useCallback(() => {
        if (!currentLesson) return;
        const mod = DUO_MODULES.find(m => m.lessons.some(l => l.id === currentLesson.id));
        if (mod) {
            const idx = mod.lessons.findIndex(l => l.id === currentLesson.id);
            if (idx < mod.lessons.length - 1) {
                handleStartLesson(mod.lessons[idx + 1], mod.title, mod.id);
                return;
            }
        }
        setScreen('hub');
        showToast('Ótimo trabalho! Selecione sua próxima lição.', 'success');
    }, [currentLesson, handleStartLesson, showToast]);



    // ---- Render ----

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#020617] z-[60] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm font-semibold">Carregando seu progresso...</p>
                </div>
            </div>
        );
    }

    if (screen === 'hub') {
        return (
            <div className="fixed inset-0 bg-[#020617] z-[60] overflow-y-auto">
                <ModuleHub
                    progress={progress}
                    onStartLesson={handleStartLesson}
                    onClose={onClose}
                    onShowAIChat={() => setShowAIChat(true)}
                />
            </div>
        );
    }

    if (screen === 'complete' && currentLesson) {
        const mod = DUO_MODULES.find(m => m.lessons.some(l => l.id === currentLesson.id));
        const idx = mod?.lessons.findIndex(l => l.id === currentLesson.id) ?? -1;
        // Para lições dinâmicas, por enquanto sempre volta ao hub ou oferece próxima se houver padrão (l1, l2...)
        const hasNext = (mod && idx < mod.lessons.length - 1) || (currentLesson.id.includes('_l1'));

        return (
            <div className="fixed inset-0 bg-[#020617] z-[60] overflow-y-auto">
                <LessonCompleteScreen
                    lesson={currentLesson}
                    correct={lessonStats.correct}
                    total={currentLesson.exercises.length}
                    xpEarned={lessonStats.xpEarned}
                    onBack={() => setScreen('hub')}
                    onNextLesson={handleNextLesson}
                    hasNextLesson={hasNext}
                />
            </div>
        );
    }

    // ---- Tela de Lição Ativa ----
    if (!currentLesson) return null;
    const ex = currentLesson.exercises[exerciseIndex];
    const progressPct = Math.round((exerciseIndex / currentLesson.exercises.length) * 100);

    return (
        <div className="fixed inset-0 bg-[#020617] z-[60] flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between py-6 max-w-5xl mx-auto w-full px-6">
                <button onClick={() => { setFeedback(null); setScreen('hub'); }} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X className="w-8 h-8" />
                </button>

                {/* Progress Bar and Remaining Indicator */}
                <div className="flex-1 mx-6 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1 px-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Nível: {currentLesson.id.split('_')[1] || 'Iniciante'}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Faltam: {currentLesson.exercises.length - exerciseIndex}
                        </span>
                    </div>
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            className="absolute top-0 left-0 bottom-0 bg-[#58cc02] rounded-full shadow-[0_4px_0_#46a302_inset]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Corações / Vidas */}
                    <div className="flex items-center gap-1">
                        {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={i < hearts ? { scale: [1, 1.15, 1] } : { scale: 1, opacity: 0.3 }}
                                transition={i < hearts ? { repeat: Infinity, duration: 2, delay: i * 0.3 } : {}}
                            >
                                <Heart
                                    className={`w-5 h-5 transition-colors ${i < hearts ? 'text-red-500 fill-red-500' : 'text-slate-700 fill-slate-700'}`}
                                />
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-8 h-8 bg-pink-500/20 rounded-xl flex items-center justify-center border border-pink-500/40 shadow-lg shadow-pink-900/20"
                        >
                            <Zap className="w-5 h-5 text-pink-500 fill-pink-500" />
                        </motion.div>
                        <span className="font-black text-pink-500 text-xl">{progress.totalXP}</span>
                    </div>

                    <button
                        title="Falar com Neural Link"
                        className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-400 hover:bg-purple-500/30 transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                        onClick={() => setShowAIChat(true)}
                    >
                        <Bot className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center px-8 text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 mb-2 max-w-5xl mx-auto w-full">
                <span>Passo {exerciseIndex + 1} de {currentLesson.exercises.length}</span>
                {wrongAnswers.length > 0 && <span className="text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg">Erros na fila: {wrongAnswers.length}</span>}
            </div>

            {/* Área do exercício */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="max-w-3xl mx-auto w-full pt-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={ex.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                        >
                            {ex.type === 'translation' && (
                                <TranslationExercise
                                    ex={ex}
                                    onAnswer={handleAnswer}
                                    disabled={!!feedback}
                                    onPlayAudio={handlePlayAudio}
                                    onShowTip={handleShowTip}
                                />
                            )}
                            {ex.type === 'multiple_choice' && (
                                <MultipleChoiceExercise
                                    ex={ex}
                                    onAnswer={handleAnswer}
                                    disabled={!!feedback}
                                    selectedAnswer={feedback?.selectedAnswer}
                                    onShowTip={handleShowTip}
                                />
                            )}
                            {ex.type === 'fill_in_blank' && (
                                <FillInBlankExercise
                                    ex={ex}
                                    onAnswer={handleAnswer}
                                    disabled={!!feedback}
                                    onShowTip={handleShowTip}
                                />
                            )}
                            {ex.type === 'listen_and_type' && (
                                <ListenAndTypeExercise
                                    ex={ex}
                                    onAnswer={handleAnswer}
                                    disabled={!!feedback}
                                    onPlayAudio={handlePlayAudio}
                                    onShowTip={handleShowTip}
                                />
                            )}
                            {ex.type === 'speak' && (
                                <SpeakExercise
                                    ex={ex}
                                    onAnswer={handleAnswer}
                                    disabled={!!feedback}
                                    onPlayAudio={handlePlayAudio}
                                    onShowTip={handleShowTip}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Feedback Overlay */}
            <AnimatePresence>
                {feedback && (
                    <FeedbackOverlay
                        isCorrect={feedback.isCorrect}
                        message={feedback.message}
                        correctAnswer={feedback.correctAnswer}
                        explanation={feedback.explanation}
                        xpEarned={feedback.xpEarned}
                        onContinue={handleContinue}
                    />
                )}
            </AnimatePresence>

            {showAIChat && (
                <SJLLiveConversation
                    onClose={() => setShowAIChat(false)}
                    isPopup={true}
                    directStart={true}
                    initialLevel={(currentLesson?.id.split('_')[1] as any) || 'Iniciante'}
                    initialArea={'Conversação Dinâmica' as any}
                />
            )}

            <AnimatePresence>
                {tip.visible && (
                    <TipOverlay
                        text={tip.text}
                        onClose={() => setTip(prev => ({ ...prev, visible: false }))}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SJLDuolingoMode;
