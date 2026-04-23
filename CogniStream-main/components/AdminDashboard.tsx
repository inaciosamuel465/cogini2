
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LayoutDashboard as DashboardIcon,
  BookOpen as ModulesIcon,
  MessageSquare as PhrasesIcon,
  Settings as SettingsIcon,
  Users as UsersIcon,
  LogOut as LogoutIcon,
  Plus as PlusIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  Save as SaveIcon,
  X as XIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  AlertCircle as AlertIcon,
  ChevronRight as ChevronIcon,
  Menu as MenuIcon,
  BarChart3 as ChartIcon,
  Globe as GlobeIcon,
  Zap as ZapIcon,
  Zap,
  Briefcase,
  FileText as LogsIcon,
  PieChart as PieIcon,
  Activity as ActivityIcon,
  Layers as LayersIcon,
  Palette as ThemeIcon,
  Layout as LayoutIcon,
  Bot as AiIcon,
  Lock as LockIcon,
  BrainCircuit,
  FileStack as BulkIcon,
  UploadCloud as SyncIcon,
  FileText as FileTextIcon,
  Bell as BellIcon,
  Send as SendIcon,
  Calendar as CalendarIcon,
  RefreshCw,
  Wifi
} from 'lucide-react';
import {
  Module, Phrase, EnglishLevel
} from '../data/syllabus';
import { MOCK_MODULES as INITIAL_MODULES, MOCK_PHRASES as INITIAL_PHRASES } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { syncInitialDataWithFirebase } from '../data/mockDataSeeder';
import { Cloud, CheckCircle, Database } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, writeBatch, collection, getDocs, updateDoc, setDoc } from 'firebase/firestore';

// --- TYPES & INTERFACES ---
interface ActivityLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
}

// --- CONSTANTS ---
const STORAGE_KEYS = {
  MODULES: 'sjl_admin_modules_v3',
  PHRASES: 'sjl_admin_phrases_v3',
  LOGS: 'sjl_admin_logs_v3'
};

const MOCK_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

// --- SHARED COMPONENTS ---
const SettingsField = ({ label, children, className = "" }: any) => (
  <div className={`space-y-3 ${className}`}>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const Modal = ({ title, onClose, children }: any) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl animate-fade-in">
      <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white"><XIcon /></button>
      <h2 className="text-2xl font-black text-white uppercase mb-10">{title}</h2>
      {children}
    </div>
  </div>
);

const StatCard = ({ title, value, icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-600/10 border-blue-500/20 text-blue-500',
    emerald: 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500',
    purple: 'bg-purple-600/10 border-purple-500/20 text-purple-500',
    orange: 'bg-orange-600/10 border-orange-500/20 text-orange-500'
  };
  return (
    <div className={`p-6 rounded-3xl border-2 ${colors[color]} backdrop-blur-md`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-xl bg-slate-900/50">{icon}</div>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{title}</p>
      <h4 className="text-3xl font-black text-white">{value}</h4>
    </div>
  );
};

const PhraseForm = ({ onClose, onSave, initialData, modules }: any) => {
  const [formData, setFormData] = useState(initialData || { moduleId: modules[0]?.id, level: 'Iniciante', type: 'sentence', portuguese: '', english: '', order: 1 });
  const [errors, setErrors] = useState<any>({});

  const validateAndSave = () => {
    const newErrors: any = {};
    if (!formData.english.trim()) newErrors.english = true;
    if (!formData.portuguese.trim()) newErrors.portuguese = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <Modal title={initialData ? 'Editar Frase' : 'Nova Frase'} onClose={onClose}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <SettingsField label="Módulo">
            <select value={formData.moduleId} onChange={e => setFormData({ ...formData, moduleId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none">
              {modules.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </SettingsField>
          <SettingsField label="Nível">
            <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none">
              {['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Executivo'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </SettingsField>
          <SettingsField label="Tipo">
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none">
              <option value="sentence">Sentença</option>
              <option value="word">Palavra</option>
            </select>
          </SettingsField>
        </div>
        <SettingsField label="Frase em Inglês">
          <input
            type="text"
            value={formData.english}
            onChange={e => { setFormData({ ...formData, english: e.target.value }); if (errors.english) setErrors({ ...errors, english: false }); }}
            className={`w-full bg-slate-950 border ${errors.english ? 'border-red-500' : 'border-slate-800'} rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors`}
            placeholder="Exactly what will be spoken..."
          />
        </SettingsField>
        <SettingsField label="Tradução em Português">
          <input
            type="text"
            value={formData.portuguese}
            onChange={e => { setFormData({ ...formData, portuguese: e.target.value }); if (errors.portuguese) setErrors({ ...errors, portuguese: false }); }}
            className={`w-full bg-slate-950 border ${errors.portuguese ? 'border-red-500' : 'border-slate-800'} rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors`}
            placeholder="Tradução fiel para o aluno..."
          />
        </SettingsField>
        <button onClick={validateAndSave} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-white font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/40">Salvar Frase</button>
      </div>
    </Modal>
  );
};

// --- MAIN COMPONENT ---
const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, isAdmin } = useAuth();
  const { settings: globalSettings, updateSettings } = useSettings();

  const [view, setView] = useState<'dashboard' | 'modules' | 'phrases' | 'bulk' | 'users' | 'settings' | 'logs' | 'deep-analysis' | 'enterprise-batch' | 'news' | 'reports' | 'agenda' | 'notifications'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [phrases, setPhrases] = useState<Phrase[]>(INITIAL_PHRASES);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [userList, setUserList] = useState<any[]>([]);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<EnglishLevel>('Iniciante');

  // Modals Control
  const [modalType, setModalType] = useState<'news' | 'event' | 'module' | 'user' | 'phrase' | null>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [alertForm, setAlertForm] = useState({ message: '', type: 'info' });

  const generatePhrasesWithAI = async () => {
    if (selectedModuleFilter === 'all') return alert("Selecione um módulo específico para gerar frases.");
    const module = modules.find(m => m.id === selectedModuleFilter);
    setIsSyncing(true);
    addLog('AI Generation', `Iniciando geração de frases para ${module?.name} (${selectedLevelFilter}).`);

    try {
      const apiKey = globalSettings.geminiApiKey || process.env.VITE_GEMINI_API_KEY || "";
      if (!apiKey) throw new Error("API Key não encontrada no sistema ou variáveis de ambiente.");

      const prompt = `Gere 10 itens de treinamento de inglês corporativo (Business English) para o módulo "${module?.name}" (${module?.description}) no nível "${selectedLevelFilter}".
      As frases devem ser úteis para profissionais do mundo real.
      Classifique como "word" se for um termo técnico/palavra isolada, ou "sentence" se for uma frase completa.
      Retorne APENAS um JSON válido (sem markdown) no seguinte formato: [{"portuguese": "...", "english": "...", "type": "word|sentence"}]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error("Falha na chamada da API do Gemini.");

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const cleanedJson = text.replace(/```json|```/g, "").trim();
      const aiPhrases = JSON.parse(cleanedJson);

      const batch = writeBatch(db);
      const newLocalPhrases: Phrase[] = [];

      aiPhrases.forEach((p: any, i: number) => {
        const id = `ai-${Date.now()}-${i}`;
        const phraseData: Phrase = {
          id,
          moduleId: selectedModuleFilter,
          level: selectedLevelFilter,
          portuguese: p.portuguese,
          english: p.english,
          type: p.type || 'sentence',
          order: Date.now() + i
        };
        batch.set(doc(db, 'phrases', id), phraseData);
        newLocalPhrases.push(phraseData);
      });

      await batch.commit();
      setPhrases(prev => [...prev, ...newLocalPhrases]);
      addLog('AI Generation', `Sucesso! 10 frases geradas para ${module?.name}.`);
      alert("10 frases geradas com sucesso via IA!");
    } catch (e: any) {
      console.error(e);
      addLog('AI Error', e.message);
      alert("Erro na geração: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const modSnap = await getDocs(collection(db, 'modules'));
        if (!modSnap.empty) setModules(modSnap.docs.map(d => ({ ...d.data(), id: d.id } as Module)));

        const phrSnap = await getDocs(collection(db, 'phrases'));
        if (!phrSnap.empty) setPhrases(phrSnap.docs.map(d => ({ ...d.data(), id: d.id } as Phrase)));

        if (view === 'users' || view === 'dashboard') {
          const snap = await getDocs(collection(db, 'users'));
          setUserList(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }

        if (view === 'news') {
          const snap = await getDocs(collection(db, 'news'));
          setNews(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }

        if (view === 'agenda') {
          const snap = await getDocs(collection(db, 'agenda'));
          setEvents(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }

        if (view === 'reports') {
          const snap = await getDocs(collection(db, 'analysis_history'));
          setReports(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }
      } catch (e) {
        console.error("Erro ao buscar dados:", e);
      }
    };
    fetchData();
  }, [view]);

  const addLog = async (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      user: user?.displayName || 'Admin',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    try {
      await updateDoc(doc(db, 'system', 'logs'), { latest: [newLog, ...logs].slice(0, 50) });
    } catch (e) { }
  };

  const handleSaveContent = async (data: any) => {
    setIsSyncing(true);
    try {
      const collectionName = modalType === 'news' ? 'news' : modalType === 'event' ? 'agenda' : 'modules';
      const id = editingContent?.id || `${modalType}-${Date.now()}`;

      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, { ...data, id }, { merge: true });

      // Atualiza o estado local para refletir a mudança imediatamente
      if (collectionName === 'modules') {
        setModules(prev => {
          const index = prev.findIndex(m => m.id === id);
          if (index >= 0) {
            const newArray = [...prev];
            newArray[index] = { ...newArray[index], ...data } as any;
            return newArray;
          }
          return [...prev, { ...data, id } as any];
        });
      }

      alert("Sucesso ao processar alteração!");
      setModalType(null);
      setEditingContent(null);
      addLog('CRUD Op', `Alterado ${modalType}: ${data.title || data.name}`);
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const sendGlobalAlert = async () => {
    if (!alertForm.message) return;
    setIsSyncing(true);
    try {
      const id = `alert-${Date.now()}`;
      await updateDoc(doc(db, 'system', 'notifications'), {
        current: { ...alertForm, id, timestamp: new Date().toISOString() }
      });
      alert("Alerta disparado para todos os usuários!");
      alert("Sucesso! " + (editingContent ? "Atualizado" : "Criado"));
      setModalType(null);
      setEditingContent(null);
    } catch (e: any) { alert(e.message); }
    finally { setIsSyncing(false); }
  };

  const handleSavePhrase = async (data: any) => {
    setIsSyncing(true);
    try {
      const id = editingContent?.id || `phrase-${Date.now()}`;
      const docRef = doc(db, 'phrases', id);
      await setDoc(docRef, { ...data, id }, { merge: true });

      setPhrases(prev => {
        const index = prev.findIndex(p => p.id === id);
        if (index >= 0) {
          const newArray = [...prev];
          newArray[index] = { ...newArray[index], ...data };
          return newArray;
        }
        return [...prev, { ...data, id }];
      });

      addLog('Phrase Save', `Frase ${id} salva com sucesso.`);
      setModalType(null);
      setEditingContent(null);
    } catch (e: any) { alert(e.message); }
    finally { setIsSyncing(false); }
  };

  // --- ANALYTICS DATA ---
  const chartsData = useMemo(() => {
    if (!modules || !phrases) return { phrasesPerModule: [], userGrowth: [], xpLevels: [], COLORS: [] };

    // 1. Distribuição de Frases por Módulo
    const phrasesPerModule = modules.map(m => ({
      name: m.name.split(' ')[0],
      value: phrases.filter(p => p.moduleId === m.id).length
    }));

    // 2. Crescimento de Usuários (Últimos 7 dias)
    const userGrowth = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStr = format(date, 'dd/MM', { locale: ptBR });
      const count = userList.length > 0 ?
        userList.filter(u => u.createdAt && u.createdAt.toDate() <= date).length :
        Math.floor(Math.random() * 20) + (i * 5);
      return { name: dayStr, users: count };
    });

    const xpLevels = [
      { name: 'Iniciante', xp: 4500 }, { name: 'Básico', xp: 8200 },
      { name: 'Intermediário', xp: 12500 }, { name: 'Avançado', xp: 18900 }, { name: 'Executivo', xp: 25400 }
    ];

    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    return { phrasesPerModule, userGrowth, xpLevels, COLORS };
  }, [modules, phrases, userList]);

  if (!isAdmin) return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[300]">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><LockIcon className="text-red-500 w-8 h-8" /></div>
        <h1 className="text-2xl font-black text-white uppercase mb-4">Acesso Negado</h1>
        <p className="text-slate-500 text-sm mb-8">Apenas usuários com cargo de administrador podem acessar este painel.</p>
        <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all">Voltar para o Hub</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#020617] z-50 flex animate-fade-in overflow-hidden">
      {/* Mobile Burger Menu */}
      <div className="md:hidden fixed top-6 left-6 z-[100]">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-2xl"
        >
          <MenuIcon size={24} />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-72' : 'w-20'} 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        fixed md:relative inset-y-0 left-0 z-[120]
        bg-slate-950 border-r border-slate-900 transition-all flex flex-col p-4 space-y-6 overflow-y-auto overflow-x-hidden
      `}>
        <div className="flex items-center justify-between mb-8 px-2">
          {sidebarOpen && <h1 className="text-xl font-black text-white tracking-tighter">COGNISTREAM <span className="text-blue-500">ADMIN</span></h1>}
          <button onClick={() => { setSidebarOpen(!sidebarOpen); setIsMobileMenuOpen(false); }} className="p-2 hover:bg-slate-900 rounded-xl text-slate-400">
            {sidebarOpen ? <ChevronIcon className="rotate-180" /> : <ChevronIcon />}
          </button>
        </div>
        <div className="flex items-center justify-between mb-4 px-2">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-xs">CS</div>
              <span className="text-white font-black tracking-tighter">COGNISTREAM <span className="text-blue-500 font-medium text-[10px] ml-1">ADMIN</span></span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-2 text-slate-500 hover:text-white transition-colors"><MenuIcon size={20} /></button>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors"><XIcon size={20} /></button>
          </div>
        </div>

        {/* MODAL SYSTEM (Real Integration) */}
        {modalType && modalType !== 'phrase' && (
          <Modal title={`${editingContent ? 'Editar' : 'Novo'} ${modalType === 'news' ? 'Notícia' : modalType === 'event' ? 'Evento' : 'Módulo'}`} onClose={() => { setModalType(null); setEditingContent(null); }}>
            <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const data = Object.fromEntries(formData); handleSaveContent(data); }} className="space-y-6">
              {/* ... generic form fields ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsField label="Título / Nome">
                  <input name={modalType === 'module' ? 'name' : 'title'} defaultValue={editingContent?.title || editingContent?.name} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none" required />
                </SettingsField>
                {modalType === 'news' && (
                  <SettingsField label="Categoria">
                    <input name="category" defaultValue={editingContent?.category} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none" placeholder="Tecnologia, Biz..." />
                  </SettingsField>
                )}
                {modalType === 'event' && (
                  <SettingsField label="Horário">
                    <input name="time" defaultValue={editingContent?.time} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none" placeholder="10:00 AM" />
                  </SettingsField>
                )}
              </div>
              <SettingsField label="Descrição / Resumo">
                <textarea name={modalType === 'news' ? 'summary' : 'description'} defaultValue={editingContent?.summary || editingContent?.description} className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-blue-500" required />
              </SettingsField>
              <button type="submit" disabled={isSyncing} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-white font-bold transition-all shadow-lg">
                {isSyncing ? <SyncIcon className="animate-spin mx-auto" /> : 'Confirmar e Sincronizar'}
              </button>
            </form>
          </Modal>
        )}

        {modalType === 'phrase' && (
          <PhraseForm
            modules={modules}
            initialData={editingContent}
            onClose={() => { setModalType(null); setEditingContent(null); }}
            onSave={handleSavePhrase}
          />
        )}

        <div className="space-y-6">
          {/* GRUPO: SISTEMA */}
          <div>
            {sidebarOpen && <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 ml-2">Infraestrutura</p>}
            <div className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
                { id: 'news', label: 'Gestão de Notícias', icon: <GlobeIcon size={18} /> },
                { id: 'notifications', label: 'Alertas & Push', icon: <BellIcon size={18} /> },
                { id: 'users', label: 'Usuários/Permissões', icon: <UsersIcon size={18} /> },
                { id: 'settings', label: 'Ajustes Globais', icon: <SettingsIcon size={18} /> },
                { id: 'agenda', label: 'Agenda & Eventos', icon: <CalendarIcon size={18} /> },
                { id: 'maintenance', label: 'Manutenção IA', icon: <Zap size={18} className="text-yellow-500" /> },
                { id: 'logs', label: 'Monitor de Logs', icon: <LogsIcon size={18} /> }
              ].map(item => (
                <button key={item.id} onClick={() => { setView(item.id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${view === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-300'}`}>
                  {item.icon}{sidebarOpen && <span className="font-bold text-xs">{item.label}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* GRUPO: SJL NEURAL LINK */}
          <div>
            {sidebarOpen && <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 ml-2 text-purple-500">SJL Neural Link</p>}
            <div className="space-y-1">
              {[
                { id: 'modules', label: 'Módulos de Ensino', icon: <ModulesIcon size={18} /> },
                { id: 'phrases', label: 'Banco de Expressões', icon: <PhrasesIcon size={18} /> },
                { id: 'reports', label: 'Relatórios Alunos', icon: <FileTextIcon size={18} /> },
                { id: 'bulk', label: 'Injeção via CSV/Massa', icon: <BulkIcon size={18} /> }
              ].map(item => (
                <button key={item.id} onClick={() => { setView(item.id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${view === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-300'}`}>
                  {item.icon}{sidebarOpen && <span className="font-bold text-xs">{item.label}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* GRUPO: SERVIÇOS IA */}
          <div>
            {sidebarOpen && <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 ml-2 text-emerald-500">Serviços de IA</p>}
            <div className="space-y-1">
              {[
                { id: 'deep-analysis', label: 'Análise Profunda', icon: <Zap size={18} /> },
                { id: 'enterprise-batch', label: 'Lote Empresarial', icon: <Briefcase size={18} /> }
              ].map(item => (
                <button key={item.id} onClick={() => setView(item.id as any)} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-300'}`}>
                  {item.icon}{sidebarOpen && <span className="font-bold text-xs">{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={onClose} className="mt-auto flex items-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"><LogoutIcon size={18} />{sidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">Sair do Painel</span>}</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-20 md:pt-10">
        {view === 'dashboard' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Visão Geral</h2>
                <p className="text-slate-500 text-sm">Status operacional do ecossistema cognitivo.</p>
              </div>
              <div className="flex gap-2">
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-black uppercase flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Sistema Online
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Frases Ativas" value={phrases.length} icon={<PhrasesIcon />} color="blue" />
              <StatCard title="Usuários" value={userList.length || '...'} icon={<UsersIcon />} color="emerald" />
              <StatCard title="IA Engine" value={globalSettings.globalModel.split('-').slice(0, 3).join('-')} icon={<AiIcon />} color="purple" />
              <StatCard title="Módulos" value={modules.length} icon={<ModulesIcon />} color="orange" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Level Breakdown Card */}
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md flex flex-col">
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8">Nível das Expressões</h3>
                <div className="space-y-4 flex-1">
                  {['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Executivo'].map(lvl => {
                    const count = phrases.filter(p => p.level === lvl).length;
                    const total = phrases.length || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={lvl} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">{lvl}</span>
                          <span className="text-white">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${lvl === 'Executivo' ? 'bg-purple-500' : lvl === 'Avançado' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Growth */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-white font-black uppercase tracking-widest text-xs">Crescimento de Alunos</h3>
                  <span className="text-emerald-500 text-[10px] font-bold">+12% vs última semana</span>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartsData.userGrowth}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {/* Module Distribution */}
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md flex flex-col">
              <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8">Distribuição por Módulo</h3>
              <div className="flex-1 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartsData.phrasesPerModule}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartsData.phrasesPerModule.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartsData.COLORS[index % chartsData.COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {chartsData.phrasesPerModule.slice(0, 4).map((m, i) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartsData.COLORS[i] }}></div>
                    <span className="text-[10px] text-slate-400 uppercase font-black">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-12 max-w-5xl animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-800 gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Ajustes Nucleares</h2>
                <p className="text-slate-500 text-xs md:text-sm">Configurações globais de sistema e comportamento de IA.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      // Sincronização direta do estado atual para o Firebase
                      const batch = writeBatch(db);

                      // 1. Módulos
                      modules.forEach(m => {
                        batch.set(doc(db, 'modules', m.id), m, { merge: true });
                      });

                      // 2. Frases (Cuidado com o limite de 500 do lote, mas aqui as frases locais são limitadas)
                      phrases.slice(0, 480).forEach(p => {
                        batch.set(doc(db, 'phrases', p.id), p, { merge: true });
                      });

                      // 3. Configurações
                      batch.set(doc(db, 'config', 'system_settings'), globalSettings, { merge: true });

                      await batch.commit();
                      addLog('Cloud Sync', 'Sincronização manual concluída com sucesso.');
                      alert("Dados atuais sincronizados com o Firebase!");
                    } catch (e: any) {
                      console.error(e);
                      alert("Erro ao sincronizar: " + e.message);
                    }
                    finally { setIsSyncing(false); }
                  }}
                  disabled={isSyncing}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {isSyncing ? <SyncIcon className="animate-spin w-4 h-4" /> : <SyncIcon className="w-4 h-4" />}
                  <span className="whitespace-nowrap">Sincronizar Cloud</span>
                </button>
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      await setDoc(doc(db, 'config', 'system_settings'), globalSettings, { merge: true });
                      updateSettings(globalSettings);
                      addLog('Settings Update', 'Configurações globais atualizadas via Painel.');
                      alert("Configurações persistidas e sincronizadas com a nuvem!");
                    } catch (e: any) {
                      alert("Erro ao salvar no banco: " + e.message);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isSyncing ? <SyncIcon className="animate-spin w-4 h-4" /> : <SaveIcon className="w-4 h-4" />} <span>Salvar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3"><ThemeIcon className="text-blue-500" /> Interface</h3>
                <SettingsField label="Cor Identidade">
                  <input type="color" value={globalSettings.themeColor} onChange={e => updateSettings({ ...globalSettings, themeColor: e.target.value })} className="w-full h-12 bg-transparent border-none cursor-pointer" />
                </SettingsField>
                <SettingsField label="Densidade UI">
                  <select value={globalSettings.uiDensity} onChange={e => updateSettings({ ...globalSettings, uiDensity: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none">
                    <option value="compact">Compacto</option><option value="normal">Normal</option><option value="spacious">Espaçoso</option>
                  </select>
                </SettingsField>
              </div>

              <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3"><AiIcon className="text-emerald-500" /> Inteligência</h3>
                <SettingsField label="Modelo Padrão">
                  <select value={globalSettings.globalModel} onChange={e => updateSettings({ ...globalSettings, globalModel: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-all">
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Max Logic)</option>
                    <option value="gemini-2.5-flash-native-audio-preview-12-2025">Gemini 2.5 Native Audio (Next-Gen)</option>
                  </select>
                </SettingsField>
                <SettingsField label={`Temperatura: ${globalSettings.temperature}`}>
                  <input type="range" min="0" max="1" step="0.1" value={globalSettings.temperature} onChange={e => updateSettings({ ...globalSettings, temperature: parseFloat(e.target.value) })} className="w-full" />
                </SettingsField>
                <SettingsField label="Chave de API do Gemini (Para serviços de IA)">
                  <input
                    type="password"
                    value={globalSettings.geminiApiKey || ''}
                    onChange={e => updateSettings({ ...globalSettings, geminiApiKey: e.target.value })}
                    placeholder="Cole a chave de API (AI Studio) aqui..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Esta chave será usada globalmente por todos os módulos que utilizam o Gemini. Ela sobrescreve a chave de ambiente.
                  </p>
                </SettingsField>
                <SettingsField label="Contexto Base do Sistema (IA)">
                  <textarea
                    value={globalSettings.aiSystemContext || ''}
                    onChange={e => updateSettings({ ...globalSettings, aiSystemContext: e.target.value })}
                    placeholder="Ex: Você é um instrutor de inglês corporativo focado em tecnologia e finanças. Use um tom profissional e encorajador."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-emerald-500 transition-all resize-none"
                  />
                </SettingsField>
              </div>

              <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800 space-y-6 md:col-span-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-3"><LayersIcon className="text-purple-500" /> Disponibilidade de Módulos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(globalSettings.enabledModules).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{key}</span>
                      <button
                        onClick={() => updateSettings({
                          ...globalSettings,
                          enabledModules: { ...globalSettings.enabledModules, [key]: !val }
                        })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${val ? 'bg-emerald-600' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${val ? 'translate-x-6' : 'translate-x-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'modules' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Módulos de Ensino (SJL)</h2>
                <p className="text-slate-500 text-sm">Gerencie as categorias e visualize os IDs para injeção de dados.</p>
              </div>
              <button
                onClick={() => setModalType('module')}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 text-sm"
              >
                <PlusIcon className="w-4 h-4" /> <span>Novo Módulo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {modules.map(m => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative group hover:border-purple-500/50 transition-all flex flex-col">
                  <div className="absolute top-4 right-4 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[9px] font-mono text-purple-400 font-bold">
                    ID: {m.id}
                  </div>
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500 border border-purple-500/20">
                    <ModulesIcon size={24} />
                  </div>
                  <h4 className="text-lg md:text-xl font-black text-white mb-2 uppercase tracking-tight">{m.name}</h4>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 flex-1">{m.description}</p>
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button
                      onClick={() => { setModalType('module'); setEditingContent(m); }}
                      className="bg-slate-950 hover:bg-slate-800 py-3 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase"
                    >
                      EDITAR
                    </button>
                    <button onClick={() => { setView('phrases'); setSelectedModuleFilter(m.id); }} className="bg-purple-600/10 hover:bg-purple-600/20 py-3 rounded-xl border border-purple-500/20 text-[10px] font-bold text-purple-400 transition-all uppercase">VER FRASES</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'phrases' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Banco de Expressões</h2>
                <p className="text-slate-500 text-xs md:text-sm">Vocabulário corporativo para IA SJL.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <SettingsField label="Módulo" className="w-full sm:w-48">
                  <select
                    value={selectedModuleFilter}
                    onChange={e => setSelectedModuleFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="all">Filtro: Todos</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </SettingsField>

                <SettingsField label="Nível" className="w-full sm:w-40">
                  <select
                    value={selectedLevelFilter}
                    onChange={e => setSelectedLevelFilter(e.target.value as EnglishLevel)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-blue-500 text-xs"
                  >
                    {['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Executivo'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </SettingsField>

                <div className="flex gap-2 h-12 mt-auto">
                  <button onClick={generatePhrasesWithAI} disabled={isSyncing || selectedModuleFilter === 'all'} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-[10px] disabled:opacity-50 transition-all">
                    {isSyncing ? <SyncIcon className="animate-spin" size={14} /> : <AiIcon size={14} />} IA
                  </button>
                  <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-[10px] shadow-lg shadow-blue-900/40 truncate" onClick={() => setModalType('phrase')}><PlusIcon size={14} /> NOVA</button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-6 py-6">Módulo</th>
                    <th className="px-6 py-6">Original (PT)</th>
                    <th className="px-6 py-6">Treino (EN)</th>
                    <th className="px-10 py-6 text-right">Controle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {phrases
                    .filter(p => (selectedModuleFilter === 'all' || p.moduleId === selectedModuleFilter) && (p.level === selectedLevelFilter))
                    .slice(0, 50)
                    .map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-all group">
                        <td className="px-10 py-5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[10px] font-mono bg-slate-950 px-2 py-1 rounded text-blue-400 border border-slate-800">
                            {p.moduleId}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-slate-400 text-sm">{p.portuguese}</td>
                        <td className="px-6 py-5 text-white font-bold text-sm tracking-tight">{p.english}</td>
                        <td className="px-10 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-3 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all"><EditIcon size={14} /></button>
                            <button className="p-3 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all"><TrashIcon size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {phrases.filter(p => selectedModuleFilter === 'all' || p.moduleId === selectedModuleFilter).length === 0 && (
                <div className="p-20 text-center">
                  <PhrasesIcon className="mx-auto text-slate-800 mb-4" size={48} />
                  <p className="text-slate-600 font-bold italic">Nenhuma frase encontrada para este filtro.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'deep-analysis' && (
          <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">Análise Deep Tech</h2>
                <p className="text-slate-500 text-xs md:text-sm">Parâmetros do motor cognitivo e grounding.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-slate-900 border border-slate-800 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] space-y-6 md:space-y-8 shadow-2xl">
                <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-3"><BrainCircuit className="text-blue-500" /> Prompts do Motor</h3>
                <div className="space-y-4 md:space-y-6">
                  <SettingsField label="Resumo Executivo">
                    <textarea className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[10px] md:text-xs font-mono text-slate-400 focus:border-blue-500 outline-none resize-none" defaultValue="Extraia os pontos chave com foco em decisões estratégicas corporativas..." />
                  </SettingsField>
                  <SettingsField label="Grounding IA">
                    <textarea className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[10px] md:text-xs font-mono text-slate-400 focus:border-blue-500 outline-none resize-none" defaultValue="Sempre procure por referências técnicas no banco de dados SJL antes de responder..." />
                  </SettingsField>
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 font-black text-xl md:text-2xl tracking-tighter uppercase leading-none">Grounding Live</p>
                    <p className="text-slate-500 text-[9px] md:text-xs mt-2 font-medium uppercase tracking-widest">Google Knowledge Graph: <span className="text-emerald-500 font-black">SYNCED</span></p>
                  </div>
                  <Zap size={32} className="text-blue-500 fill-current animate-pulse md:w-10 md:h-10" />
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] space-y-4 md:space-y-6">
                  <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-3"><ActivityIcon className="text-emerald-500" /> Formatos Ativos</h3>
                  {[
                    { label: 'Relatórios PDF', enabled: true },
                    { label: 'Análise de Sentimento', enabled: true },
                    { label: 'Mapas Cognitivos', enabled: false }
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">{f.label}</span>
                      <button className={`w-8 h-4 md:w-10 md:h-5 rounded-full relative transition-colors ${f.enabled ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                        <div className={`absolute top-0.5 md:top-1 w-3 h-3 bg-white rounded-full transition-transform ${f.enabled ? 'translate-x-4 md:translate-x-6' : 'translate-x-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'enterprise-batch' && (
          <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Lote Empresarial</h2>
                <p className="text-slate-500 text-xs md:text-sm">Gestão de créditos e filas de processamento.</p>
              </div>
              <div className="w-full md:w-auto bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center justify-between gap-4">
                <span className="text-slate-400 text-[10px] font-black uppercase">Quota Global</span>
                <span className="text-emerald-500 font-mono font-black text-lg">9.4k / 10k</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] -z-10"></div>
              <h3 className="text-lg md:text-xl font-black text-white mb-8 flex items-center gap-3"><Briefcase className="text-emerald-500" /> Licenças Ativas</h3>
              <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-black/20 text-slate-600 text-[10px] font-black uppercase">
                    <tr><th className="px-6 md:px-8 py-5 text-left">Empresa</th><th className="px-6 md:px-8 py-5 text-center">Status</th><th className="px-6 md:px-8 py-5 text-right">Créditos</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr className="text-xs md:text-sm">
                      <td className="px-6 md:px-8 py-6 text-white font-bold leading-tight">Inácio Capital Group</td>
                      <td className="px-6 md:px-8 py-6 text-center"><span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-3 py-1 rounded-full font-black border border-emerald-500/20 uppercase">PREMIUM</span></td>
                      <td className="px-6 md:px-8 py-6 text-right text-slate-400 font-mono italic">UNLIMITED</td>
                    </tr>
                    <tr className="text-xs md:text-sm opacity-50">
                      <td className="px-6 md:px-8 py-6 text-white">Guest Enterprise Demo</td>
                      <td className="px-6 md:px-8 py-6 text-center"><span className="bg-slate-800 text-slate-500 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">EXPIRADO</span></td>
                      <td className="px-6 md:px-8 py-6 text-right text-slate-400 font-mono italic">0 / 50</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'bulk' && (
          <div className="space-y-8 animate-fade-in pb-20">
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">Injeção Neural (Bulk)</h2>
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Exemplo: Português | Inglês | Iniciante | s_1"
                className="w-full h-64 md:h-80 bg-slate-950 border border-slate-800 rounded-3xl p-6 text-white font-mono text-[10px] md:text-sm mb-6 outline-none focus:border-purple-500"
              />
              <button
                onClick={async () => {
                  if (!bulkText) return alert("Insira o texto.");
                  setIsSyncing(true);
                  try {
                    const batch = writeBatch(db);
                    const lines = bulkText.split('\n').filter(l => l.trim());
                    lines.forEach((line, i) => {
                      const parts = line.split('|').map(s => s.trim());
                      if (parts.length < 4) return;
                      const [pt, en, lvl, mod] = parts;
                      const id = `bulk-${Date.now()}-${i}`;
                      batch.set(doc(db, 'phrases', id), { id, portuguese: pt, english: en, level: lvl, moduleId: mod, order: Date.now() + i });
                    });
                    await batch.commit();
                    alert("Sucesso! " + lines.length + " frases injetadas.");
                    setBulkText('');
                  } catch (e: any) { alert(e.message); }
                  finally { setIsSyncing(false); }
                }}
                disabled={isSyncing}
                className="w-full bg-purple-600 py-4 md:py-5 rounded-2xl font-black text-white text-xs md:text-sm shadow-xl shadow-purple-900/40 active:scale-95 transition-all"
              >
                {isSyncing ? 'Sincronizando...' : 'PROCESSAR INJEÇÃO'}
              </button>
            </div>
          </div>
        )}

        {view === 'users' && (
          <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Controle de Usuários</h2>
                <p className="text-slate-500">Gerencie acessos e permissões neurais.</p>
              </div>
              <button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40">
                <UsersIcon size={18} /> <span>Novo Acesso</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {userList.map(u => (
                <div key={u.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col gap-6 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-500 font-black border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-all uppercase shrink-0">
                      {u.displayName?.slice(0, 2) || u.email?.slice(0, 2) || '??'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black uppercase text-sm truncate leading-tight">{u.displayName || 'Usuário Anon'}</p>
                      <p className="text-slate-500 text-[10px] font-mono truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.role || 'GUEST'}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const newRole = u.role === 'admin' ? 'user' : 'admin';
                          try {
                            await updateDoc(doc(db, 'users', u.id), { role: newRole });
                            setUserList(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: newRole } : usr));
                            addLog('Auth Change', `Cargo de ${u.displayName} alterado para ${newRole}.`);
                          } catch (e: any) { alert(e.message); }
                        }}
                        className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-all"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button className="p-2 bg-red-600/5 hover:bg-red-600/20 rounded-lg border border-red-500/20 text-red-500 transition-all">
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'news' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gestão de Notícias</h2>
                <p className="text-slate-500">Controle o feed de atualizações do Hub.</p>
              </div>
              <button
                onClick={() => setModalType('news')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
              >
                <PlusIcon size={18} /> Nova Notícia
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-20">
              {news.length > 0 ? news.map(item => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 p-5 md:p-6 rounded-3xl space-y-4 hover:border-blue-500/50 transition-all group">
                  <div className="h-28 md:h-32 bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800">
                    <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                      <GlobeIcon size={32} className="text-blue-500 opacity-30 group-hover:opacity-60 transition-opacity" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-blue-500 tracking-widest block mb-2">{item.category || 'Global'}</span>
                    <h4 className="text-white font-black text-base md:text-lg uppercase tracking-tight line-clamp-2 leading-tight">{item.title}</h4>
                    <p className="text-slate-500 text-xs md:text-sm line-clamp-2 mt-2 leading-relaxed">{item.summary}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setModalType('news'); setEditingContent(item); }}
                      className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-400 transition-all uppercase"
                    >
                      EDITAR
                    </button>
                    <button className="flex-1 py-3 bg-red-600/10 hover:bg-red-600/20 rounded-xl border border-red-500/20 text-[10px] font-bold text-red-500 transition-all uppercase">EXCLUIR</button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full p-20 text-center bg-slate-900/40 rounded-[2.5rem] border border-dashed border-slate-800">
                  <GlobeIcon className="mx-auto text-slate-800 mb-4 opacity-20" size={48} />
                  <p className="text-slate-600 font-bold italic">Nenhuma notícia publicada.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'agenda' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Agenda Global</h2>
                <p className="text-slate-500">Gerencie eventos e reuniões do ecossistema.</p>
              </div>
              <button
                onClick={() => setModalType('event')}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
              >
                <PlusIcon size={18} /> Novo Evento
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
                <span className="text-white font-black uppercase tracking-widest text-[10px] md:text-xs">Agenda Operacional</span>
              </div>
              <div className="divide-y divide-slate-800">
                {events.length > 0 ? events.map(event => (
                  <div key={event.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-800/20 transition-all group">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-600/10 rounded-2xl border border-emerald-500/20 flex flex-col items-center justify-center">
                        <span className="text-[8px] md:text-[10px] font-black uppercase text-emerald-500 leading-none">{event.month || 'MAR'}</span>
                        <span className="text-lg md:text-xl font-black text-white leading-none">{event.day || '00'}</span>
                      </div>
                      <div>
                        <h5 className="text-white font-bold text-sm md:text-lg leading-tight uppercase tracking-tight">{event.title}</h5>
                        <p className="text-slate-500 text-[10px] md:text-xs mt-1">{event.time} • {event.location} • <span className="text-emerald-500 font-black">{event.status}</span></p>
                      </div>
                    </div>
                    <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white border border-slate-800"><ChevronIcon size={18} /></button>
                    </div>
                  </div>
                )) : (
                  <div className="p-20 text-center italic text-slate-700 text-sm">Nenhum evento agendado.</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
          {reports.length > 0 ? reports.map((rep, i) => (
            <div key={rep.id || i} className="bg-slate-900 border border-slate-800 p-5 md:p-6 rounded-[2rem] hover:border-blue-500/30 transition-all flex items-start gap-4 h-full group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <FileTextIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold uppercase tracking-tight text-xs md:text-sm truncate">Relatório: {rep.sourceTitle || 'Análise de Voz'}</p>
                <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase mt-1 tracking-widest">
                  {rep.timestamp ? format(new Date(rep.timestamp), 'dd/MM/yy HH:mm') : 'Recent • 92% Focus'}
                </p>
                <div className="flex gap-4 mt-4">
                  <button className="text-[9px] md:text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">VISUALIZAR</button>
                  <button className="text-[9px] md:text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest border-l border-slate-800 pl-4 transition-colors">PDF</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center italic text-slate-700 bg-slate-900/30 rounded-[2rem] border border-dashed border-slate-800">
              <FileTextIcon className="mx-auto mb-4 opacity-10" />
              <p className="text-sm">Nenhum relatório processado no sistema.</p>
            </div>
          )}
        </div>

        {view === 'phrases' && (
          <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-wrap justify-between items-end gap-6">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Banco de Expressões</h2>
                <p className="text-slate-500">Mapeamento de vocabulário corporativo para IA SJL.</p>
              </div>

              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <SettingsField label="Filtrar por Módulo" className="flex-1 md:w-64">
                  <select
                    value={selectedModuleFilter}
                    onChange={e => setSelectedModuleFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="all">Todos os Módulos</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </SettingsField>

                <SettingsField label="Nível" className="flex-1 md:w-48">
                  <select
                    value={selectedLevelFilter}
                    onChange={e => setSelectedLevelFilter(e.target.value as EnglishLevel)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 text-sm"
                  >
                    {['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Executivo'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </SettingsField>
              </div>

              <div className="flex gap-2 w-full md:w-auto h-14">
                <button onClick={generatePhrasesWithAI} disabled={isSyncing || selectedModuleFilter === 'all'} className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all text-xs">
                  {isSyncing ? <SyncIcon className="animate-spin" size={18} /> : <AiIcon size={18} />} Gerar com IA
                </button>
                <button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 text-xs" onClick={() => setModalType('phrase')}><PlusIcon size={18} /> Criar Individual</button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-6 py-6">Módulo / Tipo</th>
                    <th className="px-6 py-6">Original (PT)</th>
                    <th className="px-6 py-6">Treino (EN)</th>
                    <th className="px-10 py-6 text-right">Controle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {phrases
                    .filter(p => (selectedModuleFilter === 'all' || p.moduleId === selectedModuleFilter) && (p.level === selectedLevelFilter))
                    .slice(0, 50)
                    .map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-all group">
                        <td className="px-10 py-5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono bg-slate-950 px-2 py-1 rounded text-blue-400 border border-slate-800 w-fit">
                              {p.moduleId}
                            </span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border shadow-sm w-fit ${p.type === 'word' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-purple-500/10 border-purple-500/20 text-purple-500'}`}>
                              {p.type || 'sentence'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-400 text-sm">{p.portuguese}</td>
                        <td className="px-6 py-5 text-white font-bold text-sm tracking-tight">{p.english}</td>
                        <td className="px-10 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setModalType('phrase'); setEditingContent(p); }} className="p-3 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all"><EditIcon size={14} /></button>
                            <button className="p-3 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all"><TrashIcon size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {phrases.filter(p => (selectedModuleFilter === 'all' || p.moduleId === selectedModuleFilter) && (p.level === selectedLevelFilter)).length === 0 && (
                <div className="p-20 text-center">
                  <PhrasesIcon className="mx-auto text-slate-800 mb-4" size={48} />
                  <p className="text-slate-600 font-bold italic">Nenhuma frase encontrada para este filtro.</p>
                </div>
              )}
            </div>

            <div className="lg:hidden space-y-4">
              {phrases
                .filter(p => (selectedModuleFilter === 'all' || p.moduleId === selectedModuleFilter) && (p.level === selectedLevelFilter))
                .slice(0, 30)
                .map(p => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black bg-slate-950 px-3 py-1 rounded-full text-blue-400 border border-slate-800">{p.moduleId}</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Português</p>
                      <p className="text-slate-400 text-sm">{p.portuguese}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Inglês</p>
                      <p className="text-white font-bold text-lg leading-tight">{p.english}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 py-3 bg-slate-800 hover:bg-blue-600 rounded-xl text-xs font-bold text-white transition-all uppercase">EDITAR</button>
                      <button className="flex-1 py-3 bg-slate-800 hover:bg-red-600 rounded-xl text-xs font-bold text-white transition-all uppercase">EXCLUIR</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {view === 'notifications' && (
          <div className="space-y-10 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Central de Alertas</h2>
                <p className="text-slate-500 text-sm">Notificações em tempo real para o ecossistema.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
                <h3 className="text-xl font-bold text-white">Novo Alerta de Sistema</h3>
                <SettingsField label="Mensagem do Alerta (Popup System)">
                  <textarea
                    value={alertForm.message}
                    onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                    placeholder="Ex: Novos módulos de IA disponíveis! Teste agora."
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-blue-500"
                  />
                </SettingsField>
                <div className="grid grid-cols-3 gap-3">
                  {(['info', 'success', 'warning'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setAlertForm({ ...alertForm, type })}
                      className={`py-3 border rounded-xl text-[10px] font-black uppercase transition-all ${alertForm.type === type ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  onClick={sendGlobalAlert}
                  disabled={isSyncing || !alertForm.message}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 shadow-2xl disabled:opacity-50"
                >
                  {isSyncing ? <SyncIcon className="animate-spin" /> : <SendIcon size={18} />}
                  <span>DISPARAR NOTIFICAÇÃO REAL</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl"></div>
                  <h3 className="text-white font-bold mb-4">Métricas de Engajamento</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-slate-500 text-xs font-bold">Alcance Estimado</span>
                      <span className="text-white font-black">1.2k usuários</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-3/4"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-4">
                  <h3 className="text-white font-bold">Sugestões de IA para Engajamento</h3>
                  <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 italic text-slate-400 text-sm">
                    "O uso do módulo SJL Neural Link aumentou 15% nos usuários que receberam o alerta 'Continue praticando para manter sua ofensiva!'"
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'maintenance' && (
          <div className="space-y-10 animate-fade-in pb-10">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Manutenção de Sistema</h2>
              <p className="text-slate-500 text-sm">Ferramentas de recuperação e diagnóstico para APIs e Banco de Dados.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-600/10 rounded-2xl">
                    <BrainCircuit className="text-blue-500" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Integridade da IA</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Esta ação irá resetar o modelo de IA para <span className="text-blue-400 font-mono">gemini-2.5-flash-native-audio-preview-12-2025</span> e limpar caches locais de configuração. Ideal se o WebSocket estiver desconectando.
                </p>
                <button
                  onClick={() => {
                    updateSettings({ globalModel: 'gemini-2.5-flash-native-audio-preview-12-2025' });
                    alert("Configurações de IA resetadas para o padrão funcional (preview-12-2025). Lembre-se de recarregar a página.");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 shadow-2xl transition-all"
                >
                  <RefreshCw size={18} />
                  <span>RESETAR CONFIGURAÇÕES IA</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-600/10 rounded-2xl">
                    <Wifi className="text-purple-500" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Índices do Firestore</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  O erro de busca na coleção <span className="text-purple-400 font-mono">ai_memory</span> exige a criação de um índice manual no console do Firebase.
                </p>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[10px] text-slate-500 break-all">
                  https://console.firebase.google.com/v1/r/project/cognistream-5734a/firestore/indexes?create_composite=ClNwcm9qZWN0cy9jb2duaXN0cmVhbS01NzM0YS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYWlfbWVtb3J5L2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXRpbWVzdGFtcBACGgwKCF9fbmFtZV9fEAI
                </div>
                <a
                  href="https://console.firebase.google.com/v1/r/project/cognistream-5734a/firestore/indexes?create_composite=ClNwcm9qZWN0cy9jb2duaXN0cmVhbS01NzM0YS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYWlfbWVtb3J5L2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXRpbWVzdGFtcBACGgwKCF9fbmFtZV9fEAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 transition-all"
                >
                  <PlusIcon size={18} />
                  <span>CRIAR ÍNDICE MANUALMENTE</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
