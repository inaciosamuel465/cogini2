
import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Crown, ArrowLeft, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardUser {
    id: string;
    displayName: string;
    photoURL?: string;
    totalXP: number;
    streakCount: number;
    preferredName?: string;
}

const LeaderboardView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // Buscando usuários ordenados por XP
                const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(10));
                const snap = await getDocs(q);
                const users = snap.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                })) as LeaderboardUser[];
                setTopUsers(users);
            } catch (e) {
                console.error("Erro ao carregar leaderboard:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="text-yellow-400 w-6 h-6" />;
        if (index === 1) return <Medal className="text-slate-300 w-6 h-6" />;
        if (index === 2) return <Medal className="text-amber-600 w-6 h-6" />;
        return <span className="text-slate-500 font-bold w-6 text-center">{index + 1}</span>;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-blue-500/50 transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="font-bold uppercase tracking-widest text-xs">Voltar</span>
                </button>
                <div className="text-right">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3 justify-end">
                        <Trophy className="text-yellow-500" /> Ranking Global
                    </h2>
                    <p className="text-slate-500 text-sm">Os maiores talentos linguísticos da rede.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 animate-pulse font-bold uppercase tracking-widest text-xs">Sincronizando Dados...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {topUsers.map((user, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={user.id}
                            className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${index === 0
                                    ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20 shadow-lg shadow-yellow-500/5 scale-[1.02]'
                                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <div className="flex items-center justify-center w-10">
                                {getRankIcon(index)}
                            </div>

                            <img
                                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`}
                                alt={user.displayName}
                                className="w-12 h-12 rounded-2xl border-2 border-slate-800 object-cover"
                            />

                            <div className="flex-1">
                                <h4 className="text-white font-bold leading-none mb-1">
                                    {user.preferredName || user.displayName}
                                    {index === 0 && <span className="ml-2 text-[10px] font-black bg-yellow-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">Líder</span>}
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                                        <TrendingUp size={12} className="text-emerald-500" />
                                        {user.streakCount} Dias de Ofensiva
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xl font-black text-white leading-none">{user.totalXP?.toLocaleString()}</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total XP</div>
                            </div>
                        </motion.div>
                    ))}

                    {topUsers.length === 0 && (
                        <div className="text-center py-20 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
                            <Star className="mx-auto text-slate-800 mb-4" size={48} />
                            <p className="text-slate-500 italic">Nenhum competidor detectado na rede ainda.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LeaderboardView;
