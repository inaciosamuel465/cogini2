
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Briefcase, Scale, Stethoscope, Code, TrendingUp, FileText, Loader2, CheckCircle, AlertCircle, Download, X, Play, Mic, Users, ClipboardCheck, History as HistoryIcon, Maximize2, Minimize2, Battery, Wifi, Trash2, Clock } from 'lucide-react';
// Corrected import: IndustryContext is not exported from geminiService, it should come from types.
import { analyzeMedia, validateFile } from '../services/geminiService';
import { requestWakeLock, releaseWakeLock } from '../services/systemUtils';
import { AnalysisResult, IndustryContext } from '../types';
import Recorder from './Recorder';
import { generateDocument } from '../services/documentService';

interface QueueItem {
    id: string;
    file: File | null; // Null if reloaded from storage
    fileName: string; // Store name separately for persistence
    status: 'pending' | 'processing' | 'completed' | 'error';
    result?: AnalysisResult;
    error?: string;
    timestamp: number;
}

const INDUSTRIES: { id: IndustryContext; label: string; icon: any; color: string }[] = [
    { id: 'general', label: 'Geral Corporativo', icon: Briefcase, color: 'text-blue-400' },
    { id: 'legal', label: 'Jurídico & Contratos', icon: Scale, color: 'text-red-400' },
    { id: 'financial', label: 'Finanças & Mercado', icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'medical', label: 'Saúde & Pesquisa', icon: Stethoscope, color: 'text-pink-400' },
    { id: 'technical', label: 'Engenharia de Software', icon: Code, color: 'text-purple-400' },
    { id: 'marketing', label: 'Marketing & Branding', icon: FileText, color: 'text-orange-400' },
];

const EnterpriseDashboard: React.FC = () => {
    const [mode, setMode] = useState<'batch' | 'meeting'>('batch');

    // --- PERSISTENT STATE INITIALIZATION ---
    const [queue, setQueue] = useState<QueueItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sjl_ent_queue');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { }
            }
        }
        return [];
    });

    const [meetingResult, setMeetingResult] = useState<AnalysisResult | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sjl_ent_meeting');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { }
            }
        }
        return null;
    });

    const [selectedIndustry, setSelectedIndustry] = useState<IndustryContext>('general');
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [meetingProcessing, setMeetingProcessing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- PERSISTENCE EFFECTS ---
    useEffect(() => {
        // Only persist items that are completed or error, and strip the File object
        const persistableQueue = queue.map(item => ({
            ...item,
            file: null // Cannot save File object to LS
        }));
        localStorage.setItem('sjl_ent_queue', JSON.stringify(persistableQueue));
    }, [queue]);

    useEffect(() => {
        if (meetingResult) {
            localStorage.setItem('sjl_ent_meeting', JSON.stringify(meetingResult));
        }
    }, [meetingResult]);

    // Manage Wake Lock
    useEffect(() => {
        if (isRecording || isProcessingBatch || meetingProcessing || focusMode) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }
        return () => { releaseWakeLock(); };
    }, [isRecording, isProcessingBatch, meetingProcessing, focusMode]);

    // --- BATCH LOGIC ---
    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const newItems: QueueItem[] = Array.from(files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            fileName: file.name,
            status: 'pending',
            timestamp: Date.now()
        }));

        setQueue(prev => [...prev, ...newItems]);
    };

    const removeFile = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const clearCompleted = () => {
        setQueue(prev => prev.filter(item => item.status !== 'completed' && item.status !== 'error'));
    };

    const processQueue = async () => {
        setIsProcessingBatch(true);
        // Clone queue to avoid mutation during iteration logic
        const queueSnapshot = [...queue];

        for (let i = 0; i < queueSnapshot.length; i++) {
            const item = queueSnapshot[i];
            if (item.status === 'completed' || !item.file) continue; // Skip if completed or file missing (reloaded from LS)

            // Update status to processing
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q));

            try {
                const validation = validateFile(item.file);
                if (validation) throw new Error(validation);

                const result = await analyzeMedia(item.file, item.fileName, selectedIndustry);

                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed', result } : q));
            } catch (error: any) {
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', error: error.message } : q));
            }
        }
        setIsProcessingBatch(false);
    };

    // --- MEETING LOGIC ---
    const handleMeetingRecordingComplete = async (fileObj: any) => {
        // Close recording state and focus mode IMMEDIATELY
        setIsRecording(false);
        setFocusMode(false);

        // Show processing state in the main dashboard
        setMeetingProcessing(true);
        setMeetingResult(null);

        try {
            const result = await analyzeMedia(fileObj.file, "Reunião Gravada", 'meeting');
            setMeetingResult(result);
        } catch (e) {
            console.error(e);
            alert("Erro ao processar reunião.");
        } finally {
            setMeetingProcessing(false);
        }
    };

    const exportBatchCSV = () => {
        const completed = queue.filter(q => q.status === 'completed' && q.result);
        if (completed.length === 0) return;
        const headers = ["Arquivo", "Indústria", "Sentimento", "Resumo Executivo"];
        const rows = completed.map(q => {
            const r = q.result!;
            return [`"${q.fileName}"`, selectedIndustry, r.sentiment, `"${r.summary.executive.replace(/"/g, '""')}"`].join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_batch_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const selectedIndustryData = INDUSTRIES.find(i => i.id === selectedIndustry)!;
    const SelectedIcon = selectedIndustryData.icon;
    const progress = queue.length > 0 ? (queue.filter(q => q.status === 'completed').length / queue.length) * 100 : 0;
    const pendingCount = queue.filter(q => q.status === 'pending').length;

    // --- FOCUS MODE RENDER (Mobile Overlay) ---
    if (focusMode) {
        return (
            <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-between p-6 animate-fade-in safe-area-view">
                {/* Status Bar simulation */}
                <div className="w-full flex justify-between items-center text-slate-500 mb-8 mt-2">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Ativo</span>
                    <div className="flex gap-4">
                        <Wifi className="w-5 h-5" />
                        <Battery className="w-5 h-5" />
                    </div>
                </div>

                {/* Center Action Area */}
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-white tracking-tight">Modo Foco</h2>
                        <p className="text-slate-400">Tela ligada • Gravação Otimizada</p>
                    </div>

                    <button
                        onClick={() => setIsRecording(true)}
                        disabled={isRecording || meetingProcessing}
                        className={`
                    w-48 h-48 rounded-full flex items-center justify-center border-4 shadow-[0_0_50px_rgba(168,85,247,0.3)] transition-all active:scale-95
                    ${isRecording ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-slate-900 border-purple-500 hover:bg-slate-800'}
                `}
                    >
                        {meetingProcessing ? (
                            <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                        ) : isRecording ? (
                            <div className="flex flex-col items-center">
                                <span className="block w-6 h-6 bg-red-500 rounded-sm mb-2"></span>
                                <span className="text-red-500 font-mono text-sm">GRAVANDO</span>
                            </div>
                        ) : (
                            <Mic className="w-20 h-20 text-purple-500" />
                        )}
                    </button>

                    {meetingProcessing && <p className="text-purple-400 animate-pulse">Processando Inteligência...</p>}
                </div>

                {/* Footer Controls */}
                <button
                    onClick={() => setFocusMode(false)}
                    className="w-full py-4 bg-slate-800 rounded-2xl text-slate-300 font-medium flex items-center justify-center gap-2 mb-4"
                >
                    <Minimize2 className="w-5 h-5" /> Sair do Modo Foco
                </button>

                {isRecording && (
                    <Recorder
                        onRecordingComplete={handleMeetingRecordingComplete}
                        onCancel={() => setIsRecording(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto animate-fade-in pb-12 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                            <Briefcase className="w-6 h-6 text-emerald-400" />
                        </div>
                        Central Enterprise
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm md:text-base">Suite corporativa com persistência de dados e análise em lote.</p>
                </div>

                {/* Mode Switcher */}
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex overflow-x-auto">
                        <button
                            onClick={() => setMode('batch')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'batch' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Briefcase className="w-4 h-4" /> <span className="hidden sm:inline">Lote</span>
                        </button>
                        <button
                            onClick={() => setMode('meeting')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'meeting' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Users className="w-4 h-4" /> <span className="hidden sm:inline">Reunião</span>
                        </button>
                    </div>

                    {/* Mobile Focus Button */}
                    <button
                        onClick={() => setFocusMode(true)}
                        className="lg:hidden px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-700"
                    >
                        <Maximize2 className="w-4 h-4" /> Modo Foco
                    </button>
                </div>
            </div>

            {mode === 'batch' ? (
                // --- BATCH VIEW ---
                <div className="animate-fade-in space-y-8">
                    <div className="flex flex-col sm:flex-row justify-end gap-4">
                        <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800 w-full sm:w-auto">
                            <span className="text-sm text-slate-500 ml-2 font-medium uppercase tracking-wider hidden sm:inline">Lente:</span>
                            <div className="relative flex-1 sm:flex-none">
                                <select
                                    value={selectedIndustry}
                                    onChange={(e) => setSelectedIndustry(e.target.value as IndustryContext)}
                                    className="w-full sm:w-auto appearance-none bg-slate-800 text-white pl-10 pr-8 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer hover:bg-slate-700 transition-colors text-sm"
                                    disabled={isProcessingBatch}
                                >
                                    {INDUSTRIES.map(ind => (
                                        <option key={ind.id} value={ind.id}>{ind.label}</option>
                                    ))}
                                </select>
                                <SelectedIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${selectedIndustryData.color}`} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Upload & Controls */}
                        <div className="lg:col-span-1 space-y-6">
                            <div
                                onClick={() => !isProcessingBatch && fileInputRef.current?.click()}
                                className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-300 ${isProcessingBatch ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-900' : 'cursor-pointer border-slate-600 hover:border-emerald-500 hover:bg-slate-800/50'}`}
                            >
                                <input ref={fileInputRef} type="file" multiple className="hidden" accept="audio/*,video/*" onChange={(e) => handleFiles(e.target.files)} />
                                <div className="bg-emerald-500/10 p-4 rounded-full mb-4"><Upload className="w-8 h-8 text-emerald-500" /></div>
                                <p className="text-white font-medium text-center">Adicionar Arquivos</p>
                                <p className="text-xs text-slate-500 mt-2">Toque para selecionar</p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={processQueue}
                                    disabled={isProcessingBatch || pendingCount === 0}
                                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                                >
                                    {isProcessingBatch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                    {isProcessingBatch ? 'Processando...' : `Analisar (${pendingCount})`}
                                </button>

                                {queue.some(q => q.status === 'completed') && (
                                    <div className="flex gap-2">
                                        <button onClick={exportBatchCSV} className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors flex items-center justify-center gap-2">
                                            <Download className="w-4 h-4" /> CSV
                                        </button>
                                        <button onClick={clearCompleted} className="px-4 py-3 rounded-xl border border-slate-700 hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-colors" title="Limpar Concluídos">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Queue List */}
                        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-[400px] lg:h-[600px]">
                            <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-200">Fila de Processamento</h3>
                                <span className="text-xs text-slate-500">{queue.length} items</span>
                            </div>
                            <div className="h-1 w-full bg-slate-800"><div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {queue.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50"><Briefcase className="w-12 h-12 md:w-16 md:h-16 mb-4" /><p>Nenhum arquivo na fila</p></div>
                                ) : (
                                    queue.map((item) => (
                                        <div key={item.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 md:p-4 flex flex-col sm:flex-row justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0 w-full">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {item.status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> :
                                                        item.status === 'processing' ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" /> :
                                                            item.status === 'error' ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /> :
                                                                <Clock className="w-4 h-4 text-slate-500 shrink-0" />}
                                                    <span className="text-white font-medium text-sm truncate">{item.fileName}</span>
                                                    {!item.file && item.status !== 'completed' && <span className="text-xs text-red-500 ml-2">(Reupload necessário)</span>}
                                                </div>
                                                {item.result && <p className="text-xs text-slate-400 pl-6 line-clamp-2 italic">"{item.result.summary.executive}"</p>}
                                                {item.error && <p className="text-xs text-red-400 pl-6">{item.error}</p>}
                                            </div>
                                            {!isProcessingBatch && <button onClick={() => removeFile(item.id)} className="self-end sm:self-center text-slate-600 hover:text-red-400 p-2"><X className="w-4 h-4" /></button>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // --- MEETING ASSISTANT VIEW ---
                <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-500/20 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
                            <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                                <Mic className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 relative z-10">Nova Reunião</h3>
                            <p className="text-sm text-slate-400 mb-6 relative z-10">A tela não apagará durante a gravação.</p>

                            <button
                                onClick={() => setIsRecording(true)}
                                disabled={meetingProcessing}
                                className="relative z-10 w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/50 transition-all flex items-center justify-center gap-2"
                            >
                                {meetingProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                                {meetingProcessing ? 'Analisando...' : 'Gravar Agora'}
                            </button>

                            {/* Mobile Only: Focus Mode shortcut inside card */}
                            <button
                                onClick={() => setFocusMode(true)}
                                className="lg:hidden w-full mt-3 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2 text-sm"
                            >
                                <Maximize2 className="w-3 h-3" /> Abrir Modo Foco
                            </button>

                        </div>

                        {meetingResult && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h4 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                                    <Download className="w-4 h-4 text-purple-400" /> Exportar Ata
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => generateDocument(meetingResult, 'pdf', 'Ata de Reunião')}
                                        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors border border-slate-700"
                                    >
                                        PDF Profissional
                                    </button>
                                    <button
                                        onClick={() => generateDocument(meetingResult, 'md', 'Ata de Reunião')}
                                        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700"
                                    >
                                        Markdown
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        {!meetingResult ? (
                            <div className="h-full min-h-[300px] lg:min-h-[400px] bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                                <Users className="w-16 h-16 mb-4 opacity-20" />
                                <p>Inicie uma gravação para gerar a ata automaticamente.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in-up">
                                {/* Executive Summary Card */}
                                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-purple-400" /> Resumo Estratégico
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed text-sm">
                                        {meetingResult.summary.executive}
                                    </p>
                                </div>

                                {/* Action Items Card */}
                                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                        <ClipboardCheck className="w-5 h-5 text-emerald-400" /> Atividades Atribuídas
                                    </h3>
                                    <div className="grid gap-3">
                                        {meetingResult.summary.bulletPoints.map((item, idx) => (
                                            <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-slate-300 text-sm">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Insights/Strengths Card */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Pontos Fortes</h3>
                                        <ul className="space-y-2">
                                            {meetingResult.summary.insights.map((insight, idx) => (
                                                <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                                                    <span className="text-purple-400 mt-1">•</span> {insight}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Metadados</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-xs text-slate-500 block">Tom</span>
                                                <span className="text-white text-sm">{meetingResult.tone}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-500 block">Sentimento</span>
                                                <span className={`text-sm ${meetingResult.sentiment === 'Positivo' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                    {meetingResult.sentiment}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {isRecording && (
                        <Recorder
                            onRecordingComplete={handleMeetingRecordingComplete}
                            onCancel={() => setIsRecording(false)}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default EnterpriseDashboard;
