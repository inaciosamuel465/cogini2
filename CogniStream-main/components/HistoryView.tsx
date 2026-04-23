
import React, { useEffect, useState } from 'react';
// import { db } from '../services/firebase';
// import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { HistoryItem } from '../types';
import { FileText, Calendar, Play, Video, Music, ArrowRight, Loader2, Search, Trash2 } from 'lucide-react';

interface Props {
  onSelectResult: (item: HistoryItem) => void;
  onBack: () => void;
}

const HistoryView: React.FC<Props> = ({ onSelectResult, onBack }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        // MOCK IMPLEMENTATION: Read from localStorage
        // Simulate network delay
        await new Promise(r => setTimeout(r, 500));
        
        const stored = localStorage.getItem('mock_history');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Filter by user ID if necessary (in mock mode usually single user but good practice)
            const userHistory = parsed.filter((i: any) => i.userId === user.uid);
            
            // Convert string date back to object-like behavior if needed or handle in render
            setHistory(userHistory);
        } else {
            setHistory([]);
        }

        /* FIREBASE CODE COMMENTED OUT
        const q = query(
          collection(db, 'analyses'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const data: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as HistoryItem);
        });
        setHistory(data);
        */

      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const clearHistory = () => {
      if(confirm("Tem certeza que deseja limpar todo o histórico local?")) {
          localStorage.removeItem('mock_history');
          setHistory([]);
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p>Carregando sua biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">Biblioteca de Análises</h2>
           <p className="text-slate-400">Seu histórico de inteligência processada (Armazenamento Local).</p>
        </div>
        <div className="flex gap-2">
            {history.length > 0 && (
                <button onClick={clearHistory} className="px-4 py-2 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-900/20 text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Limpar
                </button>
            )}
            <button onClick={onBack} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm">
            Voltar
            </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
           <Search className="w-16 h-16 text-slate-700 mb-6" />
           <h3 className="text-xl font-bold text-white mb-2">Nada por aqui ainda</h3>
           <p className="text-slate-400 mb-6">Suas análises aparecerão aqui automaticamente após o processamento.</p>
           <button onClick={onBack} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold">
              Criar Nova Análise
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {history.map((item) => (
             <div 
               key={item.id} 
               onClick={() => onSelectResult(item)}
               className="group bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:bg-slate-800/60 shadow-lg relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-blue-500/10 transition-colors"></div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                   <div className={`p-3 rounded-xl ${item.fileType === 'video' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {item.fileType === 'video' ? <Video className="w-6 h-6" /> : <Music className="w-6 h-6" />}
                   </div>
                   <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {/* Handle both Firestore timestamp (if existed) and ISO string */}
                      {typeof item.date === 'string' 
                          ? new Date(item.date).toLocaleDateString('pt-BR') 
                          : new Date().toLocaleDateString('pt-BR')}
                   </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{item.fileName}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10 leading-relaxed">
                   {item.result.summary.executive}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                   {item.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">#{tag}</span>
                   ))}
                </div>

                <div className="flex items-center text-blue-400 text-xs font-bold uppercase tracking-widest gap-2 group-hover:translate-x-1 transition-transform">
                   Ver Relatório <ArrowRight className="w-3 h-3" />
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
