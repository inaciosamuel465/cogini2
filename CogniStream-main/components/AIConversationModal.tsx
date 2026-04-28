import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { chatWithAI } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface Props {
    onClose: () => void;
}

interface Message {
    from: 'user' | 'ai';
    text: string;
}

const AIConversationModal: React.FC<Props> = ({ onClose }) => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { from: 'ai', text: `Olá! Sou a Sarah Jane, sua assistente do CogniStream. Como posso ajudar você hoje?` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(settings.voiceEnabled ?? true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // --- SPEECH RECOGNITION (STT) ---
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'pt-BR';

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                // Trigger send automatically if desired
                handleSend(transcript);
            };

            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert("Acesso ao microfone negado. Por favor, ative a permissão nas configurações do seu navegador.");
                }
            };
            recognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition não suportado neste navegador.");
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    // --- SPEECH SYNTHESIS (TTS) ---
    const speak = useCallback((text: string) => {
        if (!isSpeaking) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1;
        // Try to find a female voice
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('pt')) || voices.find(v => v.name.includes('Female')) || voices[0];
        if (femaleVoice) utterance.voice = femaleVoice;
        window.speechSynthesis.speak(utterance);
    }, [isSpeaking]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isTyping) return;

        const userMsg: Message = { from: 'user', text: textToSend.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Prepare history for Gemini
            const history = messages.map(m => ({
                role: m.from === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: m.text }]
            }));
            history.push({ role: 'user', parts: [{ text: textToSend.trim() }] });

            const systemInstruction = `
                Você é a Sarah Jane, uma assistente virtual de elite integrada ao ecossistema CogniStream.
                Seu tom é profissional, prestativo e inspirador. 
                Você ajuda o usuário "${user?.displayName || 'Pro'}" com dúvidas sobre o sistema, aprendizado de idiomas e produtividade.
                Sempre responda de forma concisa e direta, mantendo uma personalidade amigável.
                Se o usuário falar em inglês, responda em inglês para praticar, mas ofereça tradução se necessário.
            `;

            const aiResponse = await chatWithAI(history, systemInstruction, settings.geminiApiKey);
            
            setIsTyping(false);
            const aiMsg: Message = { from: 'ai', text: aiResponse };
            setMessages((prev) => [...prev, aiMsg]);
            speak(aiResponse);
        } catch (error: any) {
            console.error("AI Error:", error);
            setIsTyping(false);
            setMessages((prev) => [...prev, { from: 'ai', text: "Desculpe, tive um problema ao processar sua solicitação. Verifique sua conexão ou chave de API." }]);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-lg h-[650px] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="bg-slate-800/50 p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-500/20">
                            <img src="/sjl_avatar.png" className="w-full h-full object-contain pt-2" alt="Sarah Jane" />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-lg leading-none">Sarah Jane</h2>
                            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Neural Hub Online
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsSpeaking(!isSpeaking)}
                            className={`p-2 rounded-xl transition-colors ${isSpeaking ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 bg-slate-800'}`}
                            title={isSpeaking ? "Desativar Voz" : "Ativar Voz"}
                        >
                            {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: msg.from === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-4 rounded-3xl ${msg.from === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20'
                                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                }`}>
                                <p className="text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 p-4 rounded-3xl rounded-tl-none border border-slate-700 flex gap-1">
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-slate-800/30 border-t border-slate-700">
                    <div className="relative flex items-center gap-3">
                        <button
                            onClick={toggleListening}
                            className={`p-4 rounded-2xl transition-all active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                        
                        <input
                            autoFocus
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? "Ouvindo..." : "Tire sua dúvida com a Sarah Jane..."}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        />
                        
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className="p-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 rounded-2xl text-white shadow-lg shadow-blue-900/40 transition-all active:scale-95"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AIConversationModal;
