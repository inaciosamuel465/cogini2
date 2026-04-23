
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Save, Target, MessageSquare, ChevronLeft, Zap, Trophy, Star, TrendingUp } from 'lucide-react';

interface UserProfileViewProps {
    onBack: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ onBack }) => {
    const { user, updateProfile } = useAuth();
    const [preferredName, setPreferredName] = useState(user?.preferredName || user?.displayName?.split(' ')[0] || '');
    const [learningFocus, setLearningFocus] = useState(user?.learningFocus || '');
    const [greetingStyle, setGreetingStyle] = useState(user?.greetingStyle || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateProfile({
                preferredName: preferredName.trim(),
                learningFocus: learningFocus.trim(),
                greetingStyle
            });
            setShowSuccess(true);
            // Delay curto para garantir que o usuário veja o feedback antes de qualquer refresh de UI
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        } catch (error) {
            console.error("Save error:", error);
            alert("Erro ao salvar perfil. Verifique sua conexão.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
                    <ChevronLeft />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Meu Perfil</h2>
                    <p className="text-slate-500 text-sm">Personalize sua experiência com a IA.</p>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 space-y-10 shadow-2xl">
                {/* Header Profile */}
                <div className="flex items-center gap-6 pb-10 border-b border-slate-800">
                    <div className="relative">
                        <img src={user?.photoURL || 'https://via.placeholder.com/80'} alt="Profile" className="w-24 h-24 rounded-3xl border-2 border-blue-500/50 object-cover shadow-lg" />
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl border border-slate-900 shadow-lg">
                            <User size={16} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white leading-tight">{user?.displayName}</h3>
                        <p className="text-slate-500 font-mono text-xs mt-1">{user?.email}</p>
                        <div className="flex gap-2 mt-3">
                            <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400">
                                {user?.role === 'admin' ? 'Acesso Administrativo' : 'ESTUDANTE'}
                            </div>
                            <div className="inline-flex items-center px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-500 gap-1">
                                <Zap size={10} fill="currentColor" /> {user?.streakCount || 0} DIAS
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gamification Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Star size={48} className="text-blue-500" />
                        </div>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Experiência Total</p>
                                <h4 className="text-3xl font-black text-white">{user?.totalXP || 0} <span className="text-sm text-blue-500">XP</span></h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nível</p>
                                <h4 className="text-xl font-black text-blue-500">{Math.floor((user?.totalXP || 0) / 1000) + 1}</h4>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000"
                                style={{ width: `${((user?.totalXP || 0) % 1000) / 10}%` }}
                            />
                        </div>
                        <p className="text-[9px] text-slate-600 mt-2 text-right uppercase font-bold">{(user?.totalXP || 0) % 1000} / 1000 XP para o próximo nível</p>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy size={48} className="text-amber-500" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Minhas Medalhas</p>
                        <div className="flex gap-3 flex-wrap">
                            {user?.badges && user.badges.length > 0 ? (
                                user.badges.map((badge, i) => (
                                    <div key={i} className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 hover:scale-110 transition-transform cursor-help" title={badge}>
                                        <Star size={18} fill="currentColor" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-600 italic">Nenhuma medalha conquistada ainda.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <User size={14} className="text-blue-500" /> Como a IA deve te chamar?
                        </label>
                        <input
                            type="text"
                            value={preferredName}
                            onChange={(e) => setPreferredName(e.target.value)}
                            placeholder="Ex: Inácio"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                        />
                        <p className="text-[10px] text-slate-500 italic">A IA usará este nome em conversas em tempo real.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Target size={14} className="text-emerald-500" /> Qual seu foco de aprendizado?
                        </label>
                        <textarea
                            value={learningFocus}
                            onChange={(e) => setLearningFocus(e.target.value)}
                            placeholder="Ex: Melhorar meu vocabulário comercial e negociação internacional."
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium resize-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={14} className="text-purple-500" /> Estilo de Início de Conversa
                        </label>
                        <select
                            value={greetingStyle}
                            onChange={(e) => setGreetingStyle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-purple-500 transition-all font-medium"
                        >
                            <option value="">Padrão do Sistema</option>
                            <option value="formal">Muito Formal e Respeitoso</option>
                            <option value="casual">Casual e Amigável</option>
                            <option value="direct">Direto ao Ponto (Sem conversa fiada)</option>
                            <option value="motivational">Enérgico e Motivador</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 space-y-4">
                    <button
                        disabled={isSaving}
                        onClick={handleSave}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${showSuccess
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-blue-900/40 active:scale-95'
                            } disabled:opacity-50`}
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : showSuccess ? (
                            <>Salvo com Sucesso!</>
                        ) : (
                            <>
                                <Save size={18} /> Salvar Alterações
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => {
                            localStorage.removeItem('cogni_tour_seen');
                            window.location.reload();
                        }}
                        className="w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <TrendingUp size={14} /> Resetar Guia de Introdução
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileView;
