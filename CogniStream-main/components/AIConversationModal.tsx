import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles } from 'lucide-react';

interface Props {
    onClose: () => void;
}

const AIConversationModal: React.FC<Props> = ({ onClose }) => {
    const [messages, setMessages] = useState<Array<{ from: 'user' | 'ai'; text: string }>>([
        { from: 'ai', text: 'Olá! Sou a Sarah Jane, sua preceptora Neural Link. Como posso ajudar com sua lição de inglês agora?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = { from: 'user' as const, text: input.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate Neural Link thinking
        setTimeout(() => {
            setIsTyping(false);
            const aiMsg = {
                from: 'ai' as const,
                text: `Entendi sua dúvida sobre "${userMsg.text}". No contexto corporativo, costumamos usar estruturas mais formais. Gostaria de praticar mais frases desse tipo?`
            };
            setMessages((prev) => [...prev, aiMsg]);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="bg-slate-800/50 p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-purple-500 shadow-lg shadow-purple-500/20">
                            <img src="https://img.freepik.com/free-photo/portrait-successful-business-woman-gray-suit_1303-27856.jpg?w=740" className="w-full h-full object-cover" alt="Sarah Jane" />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-lg leading-none">Sarah Jane</h2>
                            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Neural Link Online
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
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
                            <div className={`max-w-[80%] p-4 rounded-3xl ${msg.from === 'user'
                                    ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-900/20'
                                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                }`}>
                                <p className="text-sm md:text-base font-medium">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 p-4 rounded-3xl rounded-tl-none border border-slate-700 flex gap-1">
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 bg-slate-800/30 border-t border-slate-700">
                    <div className="relative flex items-center gap-3">
                        <input
                            autoFocus
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Tire sua dúvida com a Sarah Jane..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-800 rounded-2xl text-white shadow-lg shadow-purple-900/40 transition-all active:scale-95"
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
