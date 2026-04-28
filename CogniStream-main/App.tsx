
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadedFile, ProcessingState, ProcessingStage, AnalysisResult, HistoryItem } from './types';
import InputSection from './components/InputSection';
import ProcessingView from './components/ProcessingView';
import AnalysisDashboard from './components/AnalysisDashboard';
import Recorder from './components/Recorder';
import HowItWorks from './components/HowItWorks';
import LiveConversation from './components/LiveConversation';
import LiveTranslation from './components/LiveTranslation';
import EnterpriseDashboard from './components/EnterpriseDashboard';
import SJLDuolingoMode from './components/SJLDuolingoMode';
import AdminDashboard from './components/AdminDashboard';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import ParticleBackground from './components/ParticleBackground';
import AuthModal from './components/AuthModal';
import HistoryView from './components/HistoryView';
import UserProfileView from './components/UserProfileView';
import LeaderboardView from './components/LeaderboardView';
import WelcomeTour from './components/WelcomeTour';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { analyzeMedia } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import AIConversationModal from './components/AIConversationModal';
import { Bot, Briefcase, Sparkles, Globe, LayoutGrid, Zap, Layers, Menu, X, ArrowRight, FileText, History as HistoryIcon, LogIn, LogOut, User, Settings as SettingsIcon, Truck, Workflow, RefreshCw, CheckCircle, Trophy } from 'lucide-react';

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: ProcessingStage.IDLE,
    progress: 0,
    message: ''
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [view, setView] = useState<'hub' | 'analyze' | 'enterprise' | 'sjl' | 'translator' | 'live-assistant' | 'how-it-works' | 'history' | 'admin' | 'profile' | 'leaderboard'>('hub');
  const { showToast } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('cogni_tour_seen');
    if (!hasSeenTour && view === 'hub') {
      const timer = setTimeout(() => setShowTour(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [view]);

  const handleTourComplete = () => {
    localStorage.setItem('cogni_tour_seen', 'true');
    setShowTour(false);
  };

  // Apply global styles (Theme, Density, Animations)
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.themeColor);

    // UI Density
    if (settings.uiDensity === 'compact') {
      root.classList.add('ui-compact');
      root.classList.remove('ui-spacious');
    } else if (settings.uiDensity === 'spacious') {
      root.classList.add('ui-spacious');
      root.classList.remove('ui-compact');
    } else {
      root.classList.remove('ui-compact', 'ui-spacious');
    }

    // Animations
    if (!settings.animationsEnabled) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }, [settings]);


  const startAnalysis = async (uploadedFile: UploadedFile) => {
    setFile(uploadedFile);
    setProcessingState({
      stage: ProcessingStage.UPLOADING,
      progress: 20,
      message: uploadedFile.useGrounding ? 'Conectando ao Google Search e Neural Engine...' : 'Preparando mídia para análise profunda...'
    });

    try {
      const analysisData = await analyzeMedia(
        uploadedFile.file,
        uploadedFile.url || uploadedFile.name,
        'general',
        uploadedFile.analysisMode || 'detailed',
        uploadedFile.targetLanguage || 'pt-BR',
        uploadedFile.useGrounding || false,
        user?.uid, // Passa o ID do usuário para salvar
        uploadedFile.analysisCategory,
        settings.geminiApiKey
      );

      setProcessingState({ stage: ProcessingStage.COMPLETED, progress: 100, message: 'Relatório Finalizado' });
      setResult(analysisData);
      showToast(uploadedFile.useGrounding ? "Análise com Grounding concluída!" : "Análise estratégica concluída!", 'success');
    } catch (error: any) {
      setProcessingState({ stage: ProcessingStage.ERROR, progress: 0, message: 'Falha na análise.', error: error.message });
      showToast("Erro durante o processamento.", 'error');
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setResult(null);
    setProcessingState({ stage: ProcessingStage.IDLE, progress: 0, message: '' });
  };

  const handleBackToHub = () => {
    resetAnalysis();
    setIsRecording(false);
    setView('hub');
  };

  const handleHistorySelection = (item: HistoryItem) => {
    setResult(item.result);
    setFile({
      file: null, // Arquivo original não é recuperado do firestore nesta versão simples
      name: item.fileName,
      type: item.fileType,
      url: null
    });
    setProcessingState({ stage: ProcessingStage.COMPLETED, progress: 100, message: 'Carregado do Histórico' });
    setView('analyze');
  };

  const navigateTo = (target: typeof view) => {
    if (target === 'history' && !user) {
      setShowAuthModal(true);
      return;
    }
    setView(target);
  };

  const renderHub = () => (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in-up pb-32 relative z-10">
      <div className="text-center space-y-4 pt-6 px-4">
        <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight">
          Cogni<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Stream</span>
        </h1>
        <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto">
          Plataforma de inteligência multimodal com <span className="text-blue-400 font-semibold">Google Search Grounding</span> e persistência na nuvem.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pb-32">
        {/* Card 1: Análise Profunda */}
        {settings.enabledModules.analyze && (
          <div id="step-analyze" onClick={() => navigateTo('analyze')} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-[var(--primary-color)]/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-xl active:scale-95 overflow-hidden">
            <div className="h-40 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-900/30 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-500"></div>
              <img src="/images/analyze.png" alt="Análise Profunda" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 absolute -top-6 left-6 border border-slate-700 shadow-lg"><Zap className="w-6 h-6 text-[var(--primary-color)]" /></div>
              <h3 className="text-xl font-bold text-white mb-1 mt-4">Análise Profunda</h3>
              <p className="text-slate-400 text-sm">Upload de arquivos com verificação de fatos via Google Search.</p>
            </div>
          </div>
        )}

        {/* Card 2: Enterprise Dashboard */}
        {settings.enabledModules.enterprise && (
          <div onClick={() => navigateTo('enterprise')} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-xl active:scale-95 overflow-hidden">
            <div className="h-40 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-900/30 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-500"></div>
              <img src="/images/enterprise.png" alt="Enterprise Lote" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 absolute -top-6 left-6 border border-slate-700 shadow-lg"><Briefcase className="w-6 h-6 text-emerald-400" /></div>
              <h3 className="text-xl font-bold text-white mb-1 mt-4">Enterprise Lote</h3>
              <p className="text-slate-400 text-sm">Processamento em massa e geração de Atas de Reunião.</p>
            </div>
          </div>
        )}

        {/* Card 3: SJL Neural Link */}
        {settings.enabledModules.sjl && (
          <div id="step-sjl" onClick={() => navigateTo('sjl')} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-purple-500/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-xl active:scale-95 overflow-hidden">
            <div className="h-40 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-900/30 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-500"></div>
              <img src="/images/sjl.png" alt="SJL Neural Link" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 absolute -top-6 left-6 border border-slate-700 shadow-lg"><Layers className="w-6 h-6 text-purple-400" /></div>
              <h3 className="text-xl font-bold text-white mb-1 mt-4">SJL Neural Link</h3>
              <p className="text-slate-400 text-sm">Treinamento corporativo de idiomas com instrutora IA.</p>
            </div>
          </div>
        )}

        {/* Card 4: Tradutor Neural */}
        {settings.enabledModules.translator && (
          <div id="step-translator" onClick={() => navigateTo('translator')} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-xl active:scale-95 overflow-hidden">
            <div className="h-40 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-900/30 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-500"></div>
              <img src="/images/translator.png" alt="Tradutor Neural" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 absolute -top-6 left-6 border border-slate-700 shadow-lg"><Globe className="w-6 h-6 text-indigo-400" /></div>
              <h3 className="text-xl font-bold text-white mb-1 mt-4">Tradutor Neural</h3>
              <p className="text-slate-400 text-sm">Intérprete simultâneo bidirecional com histórico.</p>
            </div>
          </div>
        )}

        {/* Card 5: Assistente Ao Vivo */}
        {settings.enabledModules.liveAssistant && (
          <div onClick={() => navigateTo('live-assistant')} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-xl active:scale-95 overflow-hidden">
            <div className="h-40 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-900/30 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-500"></div>
              <img src="/images/assistant.png" alt="Assistente Ao Vivo" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 absolute -top-6 left-6 border border-slate-700 shadow-lg"><Bot className="w-6 h-6 text-emerald-400" /></div>
              <h3 className="text-xl font-bold text-white mb-1 mt-4">Assistente Ao Vivo</h3>
              <p className="text-slate-400 text-sm">Conversação multimodal com visão computacional.</p>
            </div>
          </div>
        )}

        {/* Card 6: Biblioteca */}
        {settings.enabledModules.history && (
          <div onClick={() => navigateTo('history')} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-orange-500/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-xl active:scale-95 overflow-hidden">
            <div className="h-40 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-orange-900/30 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-500"></div>
              <img src="/images/library.png" alt="Minha Biblioteca" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 absolute -top-6 left-6 border border-slate-700 shadow-lg"><HistoryIcon className="w-6 h-6 text-orange-400" /></div>
              <h3 className="text-xl font-bold text-white mb-1 mt-4">Minha Biblioteca</h3>
              <p className="text-slate-400 text-sm">{user ? 'Acesse seu histórico de análises na nuvem.' : 'Faça login para salvar seus relatórios.'}</p>
            </div>
          </div>
        )}

        {/* Card 7: Ranking Global */}
        <div onClick={() => navigateTo('leaderboard')} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-yellow-500/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-xl active:scale-95 overflow-hidden">
          <div className="h-40 w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-900/30 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-500"></div>
            <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80" alt="Ranking Global" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
          </div>
          <div className="p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 absolute -top-6 left-6 border border-slate-700 shadow-lg"><Trophy className="w-6 h-6 text-yellow-500" /></div>
            <h3 className="text-xl font-bold text-white mb-1 mt-4">Ranking Global</h3>
            <p className="text-slate-400 text-sm">Descubra quem são os talentos em destaque no CogniStream.</p>
          </div>
        </div>

        {/* Card 8: Admin */}
        <div onClick={() => navigateTo('admin')} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-red-500/50 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 shadow-xl active:scale-95 overflow-hidden">
          <div className="h-40 w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-red-900/30 mix-blend-overlay z-10 group-hover:bg-transparent transition-all duration-500"></div>
            <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80" alt="Administração" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
          </div>
          <div className="p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4 absolute -top-6 left-6 border border-slate-700 shadow-lg"><SettingsIcon className="w-6 h-6 text-red-400" /></div>
            <h3 className="text-xl font-bold text-white mb-1 mt-4">Administração</h3>
            <p className="text-slate-500 text-sm">Gerencie módulos, frases e configurações globais.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans overflow-x-hidden relative">
      <ParticleBackground />
      <PWAInstallPrompt />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      <AnimatePresence>
        {showTour && <WelcomeTour onComplete={handleTourComplete} />}
      </AnimatePresence>

      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToHub}>
            <div className="bg-gradient-to-tr from-[var(--primary-color)] to-indigo-600 p-2 rounded-lg shadow-lg"><LayoutGrid className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-xl text-white">Cogni<span className="text-[var(--primary-color)]">Stream</span></span>
          </div>
          <div className="flex items-center gap-4">
            {view !== 'hub' && (
              <button onClick={handleBackToHub} className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 hidden md:flex">
                <HistoryIcon className="w-4 h-4" /> Hub
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setView('profile')}
                  className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors rounded-full pl-1 pr-3 py-1 border border-slate-700"
                >
                  <img id="step-profile" src={user.photoURL || 'https://via.placeholder.com/32'} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                  <span className="text-xs font-medium text-white hidden md:inline">{user.preferredName || user.displayName?.split(' ')[0]}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); logout(); }}
                  className="flex items-center gap-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
              >
                <LogIn className="w-4 h-4" /> Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto pt-8 pb-32 px-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'hub' && renderHub()}
            {view === 'history' && <HistoryView onBack={handleBackToHub} onSelectResult={handleHistorySelection} />}
            {view === 'analyze' && (
              <div className="animate-fade-in">
                {processingState.stage === ProcessingStage.ERROR && (
                  <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-center">
                    <p className="text-red-200 mb-4">{processingState.error}</p>
                    <button onClick={resetAnalysis} className="px-4 py-2 bg-red-600 text-white rounded-lg">Reiniciar</button>
                  </div>
                )}
                {!file && !isRecording && (
                  <InputSection
                    onFileSelected={startAnalysis}
                    onStartRecording={() => setIsRecording(true)}
                    onStartLiveConversation={() => navigateTo('live-assistant')}
                    onStartLiveTranslation={() => navigateTo('translator')}
                    isProcessing={false}
                  />
                )}
                {file && !result && processingState.stage !== ProcessingStage.ERROR && <ProcessingView state={processingState} />}
                {result && file && <AnalysisDashboard data={result} file={file} onReset={resetAnalysis} />}
              </div>
            )}
            {view === 'enterprise' && <EnterpriseDashboard />}
            {view === 'sjl' && <SJLDuolingoMode onClose={handleBackToHub} />}
            {view === 'translator' && <LiveTranslation onClose={handleBackToHub} />}
            {view === 'live-assistant' && <LiveConversation onClose={handleBackToHub} />}
            {view === 'how-it-works' && <HowItWorks onBack={handleBackToHub} />}
            {view === 'admin' && <AdminDashboard onClose={handleBackToHub} />}
            {view === 'profile' && <UserProfileView onBack={handleBackToHub} />}
            {view === 'leaderboard' && <LeaderboardView onBack={handleBackToHub} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {isRecording && (
        <Recorder
          onRecordingComplete={startAnalysis}
          onCancel={() => setIsRecording(false)}
        />
      )}

      {/* Floating Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAIChat(true)}
          className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 border border-white/10 group transition-all"
        >
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 group-hover:animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#020617] animate-pulse"></div>
        </motion.button>
      </div>

      <AnimatePresence>
        {showAIChat && (
          <AIConversationModal onClose={() => setShowAIChat(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};


const AppWrapper = () => (
  <NotificationProvider>
    <App />
  </NotificationProvider>
);

export default AppWrapper;
