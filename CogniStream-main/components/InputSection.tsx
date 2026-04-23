
import React, { useCallback, useRef, useState } from 'react';
import { Upload, Mic, Link as LinkIcon, ArrowRight, X, ListFilter, FileText, Globe, Zap, Search, Image, ClipboardList, Eye, BookOpen } from 'lucide-react';
import { UploadedFile, AnalysisMode, AnalysisLanguage, AnalysisCategory } from '../types';
import { validateFile } from '../services/geminiService';

interface Props {
  onFileSelected: (file: UploadedFile) => void;
  onStartRecording: () => void;
  onStartLiveConversation: () => void;
  onStartLiveTranslation: () => void;
  isProcessing: boolean;
}

const InputSection: React.FC<Props> = ({
  onFileSelected,
  onStartRecording,
  onStartLiveConversation,
  onStartLiveTranslation,
  isProcessing
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('detailed');
  const [analysisCategory, setAnalysisCategory] = useState<AnalysisCategory | undefined>(undefined);
  const [targetLanguage, setTargetLanguage] = useState<AnalysisLanguage>('pt-BR');
  const [useGrounding, setUseGrounding] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    // Imagens não passam pelo validador de mídia audio/video
    const isImage = file.type.startsWith('image');
    if (!isImage) {
      const validationError = validateFile(file);
      if (validationError) { setError(validationError); return; }
    }

    setError(null);
    const fileType = isImage ? 'image' : (file.type.startsWith('video') ? 'video' : 'audio');
    onFileSelected({
      file,
      url: URL.createObjectURL(file),
      type: fileType as 'audio' | 'video' | 'image',
      name: file.name,
      analysisMode,
      analysisCategory: isImage ? (analysisCategory || 'visual') : analysisCategory,
      targetLanguage,
      useGrounding
    });
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;
    onFileSelected({
      file: null, url: linkUrl, type: 'video', name: linkUrl, analysisMode, analysisCategory, targetLanguage, useGrounding
    });
    setShowLinkInput(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-3xl font-bold text-white">Configurações de Análise</h2>
        <p className="text-slate-400">Personalize o idioma e a profundidade do seu relatório estratégico.</p>
      </div>

      <div className="flex flex-col justify-center items-center gap-4 mb-10">
        {/* ROW 1: Profundidade + Grounding + Idioma */}
        <div className="flex flex-wrap justify-center items-center gap-3">
          <div className="bg-slate-900/80 p-1.5 rounded-2xl flex border border-slate-700 backdrop-blur-sm shadow-xl">
            <button onClick={() => setAnalysisMode('concise')} className={`px-4 md:px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${analysisMode === 'concise' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              <ListFilter className="w-4 h-4" /> Conciso
            </button>
            <button onClick={() => setAnalysisMode('detailed')} className={`px-4 md:px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${analysisMode === 'detailed' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              <FileText className="w-4 h-4" /> Profundo
            </button>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-2xl flex border border-slate-700 backdrop-blur-sm shadow-xl">
            <button
              onClick={() => setUseGrounding(!useGrounding)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${useGrounding ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-500 hover:text-slate-300'}`}
              title="Conectar ao Google Search para validar fatos"
            >
              <Search className="w-4 h-4" />
              {useGrounding ? 'Google Search Ativo' : 'Ativar Grounding'}
            </button>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-2xl flex border border-slate-700 backdrop-blur-sm shadow-xl">
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase flex items-center hidden md:flex">Relatório em:</span>
            <button onClick={() => setTargetLanguage('pt-BR')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${targetLanguage === 'pt-BR' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>PT</button>
            <button onClick={() => setTargetLanguage('en-US')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${targetLanguage === 'en-US' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>EN</button>
            <button onClick={() => setTargetLanguage('es-ES')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${targetLanguage === 'es-ES' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>ES</button>
          </div>
        </div>

        {/* ROW 2: Categorias de Análise */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: undefined as AnalysisCategory | undefined, label: 'Completa', icon: Zap, color: 'blue' },
            { id: 'transcription' as AnalysisCategory, label: 'Transcrição', icon: BookOpen, color: 'purple' },
            { id: 'investigation' as AnalysisCategory, label: 'Investigação', icon: Search, color: 'emerald' },
            { id: 'visual' as AnalysisCategory, label: 'Análise Visual', icon: Eye, color: 'amber' },
            { id: 'meeting_minutes' as AnalysisCategory, label: 'Ata de Reunião', icon: ClipboardList, color: 'rose' },
          ].map(cat => {
            const isActive = analysisCategory === cat.id;
            const colorMap: Record<string, string> = {
              blue: isActive ? 'bg-blue-600 text-white shadow-blue-900/30' : 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10',
              purple: isActive ? 'bg-purple-600 text-white shadow-purple-900/30' : 'text-slate-500 hover:text-purple-400 hover:bg-purple-500/10',
              emerald: isActive ? 'bg-emerald-600 text-white shadow-emerald-900/30' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10',
              amber: isActive ? 'bg-amber-600 text-white shadow-amber-900/30' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10',
              rose: isActive ? 'bg-rose-600 text-white shadow-rose-900/30' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10',
            };
            return (
              <button
                key={cat.label}
                onClick={() => setAnalysisCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg border border-slate-700/50 ${colorMap[cat.color]}`}
              >
                <cat.icon className="w-4 h-4" /> {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {!showLinkInput ? (
          <div
            className={`relative h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer group ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/40 hover:bg-slate-800/60 hover:border-blue-500/50 shadow-lg'}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" className="hidden" accept="audio/*,video/*,image/*" onChange={(e) => handleFiles(e.target.files)} />
            <div className="bg-blue-500/10 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform"><Upload className="w-10 h-10 text-blue-400" /></div>
            <p className="text-white font-bold text-lg">Subir Mídia</p>
            <p className="text-slate-500 text-sm mt-1">Áudio, Vídeo ou Imagem</p>
          </div>
        ) : (
          <div className="h-64 border border-slate-700 bg-slate-900/40 rounded-3xl p-8 flex flex-col justify-center animate-fade-in shadow-lg">
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="url" placeholder="URL do Vídeo..." required className="w-full bg-slate-950 border border-slate-700 rounded-xl px-10 py-3 text-white text-sm focus:border-blue-500 focus:outline-none" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowLinkInput(false)} className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase hover:text-white">Voltar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-500"><ArrowRight className="w-5 h-5 mx-auto" /></button>
              </div>
            </form>
          </div>
        )}

        <button onClick={() => setShowLinkInput(true)} className="h-64 bg-slate-900/40 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center hover:bg-slate-800/60 hover:border-purple-500/50 transition-all shadow-lg group">
          <div className="bg-purple-500/10 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform"><LinkIcon className="w-10 h-10 text-purple-400" /></div>
          <h3 className="text-white font-bold text-lg">Analisar Link</h3>
          <p className="text-slate-500 text-sm mt-1">YouTube / Web / Cloud</p>
        </button>

        <button onClick={onStartRecording} className="h-64 bg-slate-900/40 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center hover:bg-slate-800/60 hover:border-red-500/50 transition-all shadow-lg group">
          <div className="bg-red-500/10 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform"><Mic className="w-10 h-10 text-red-400" /></div>
          <h3 className="text-white font-bold text-lg">Gravar Agora</h3>
          <p className="text-slate-500 text-sm mt-1">Voz em Tempo Real</p>
        </button>

        <button onClick={onStartLiveConversation} className="h-64 bg-slate-900/40 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all shadow-lg group">
          <div className="bg-emerald-500/10 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform"><Zap className="w-10 h-10 text-emerald-400" /></div>
          <h3 className="text-white font-bold text-lg">Live Assistant</h3>
          <p className="text-slate-500 text-sm mt-1">Visão Multimodal</p>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex justify-between items-center animate-shake">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  );
};

export default InputSection;
