
import React, { useState, useRef } from 'react';
import { AnalysisResult, UploadedFile } from '../types';
import { FileText, List, Layers, Languages, Download, ArrowLeft, AlignLeft, ShieldAlert, Zap, ClipboardCheck, MessageSquare, Globe, Play, Loader2, Music, Scissors, Search, ExternalLink } from 'lucide-react';
import { generateDocument } from '../services/documentService';
import { audioBufferToWav } from '../services/audioUtils';

interface Props {
  data: AnalysisResult;
  file: UploadedFile;
  onReset: () => void;
}

const AnalysisDashboard: React.FC<Props> = ({ data, file, onReset }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'transcript' | 'translation' | 'insights'>('summary');

  // Audio Clipping State
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [fullAudioBuffer, setFullAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<number | null>(null);
  const activeSourceNode = useRef<AudioBufferSourceNode | null>(null);

  const exportOptions = [
    { label: 'PDF Profissional', format: 'pdf' as const },
    { label: 'Markdown', format: 'md' as const },
    { label: 'Texto Simples', format: 'txt' as const },
  ];

  const handleLoadAudio = async () => {
    if (!file.file) return;
    setAudioLoading(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setAudioCtx(ctx);
      setFullAudioBuffer(decoded);
    } catch (e) {
      console.error("Audio decoding failed", e);
      alert("Erro ao decodificar áudio. O arquivo pode estar corrompido ou formato não suportado.");
    } finally {
      setAudioLoading(false);
    }
  };

  const parseTime = (timeStr: string): number => {
    // Expected "MM:SS" or "HH:MM:SS"
    const parts = timeStr.trim().split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    if (parts.length === 3) return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    return 0;
  };

  const getSegmentRange = (timestamp: string): { start: number, end: number, duration: number } => {
    // Expected "MM:SS - MM:SS"
    const parts = timestamp.split('-').map(s => s.trim());
    const start = parseTime(parts[0]);
    const end = parts.length > 1 ? parseTime(parts[1]) : start + 10; // Default 10s if no end
    return { start, end, duration: end - start };
  };

  const playSegment = (timestamp: string, index: number) => {
    if (!audioCtx || !fullAudioBuffer) return;

    // Stop current
    if (activeSourceNode.current) {
      activeSourceNode.current.stop();
      activeSourceNode.current = null;
      if (playingSegmentId === index) {
        setPlayingSegmentId(null);
        return;
      }
    }

    const { start, duration } = getSegmentRange(timestamp);
    const source = audioCtx.createBufferSource();
    source.buffer = fullAudioBuffer;
    source.connect(audioCtx.destination);
    source.start(0, start, duration);

    activeSourceNode.current = source;
    setPlayingSegmentId(index);

    source.onended = () => {
      setPlayingSegmentId(null);
      activeSourceNode.current = null;
    };
  };

  const downloadSegment = (timestamp: string, index: number) => {
    if (!audioCtx || !fullAudioBuffer) return;

    const { start, duration } = getSegmentRange(timestamp);

    // Calculate frames
    const startFrame = Math.floor(start * fullAudioBuffer.sampleRate);
    const frameCount = Math.floor(duration * fullAudioBuffer.sampleRate);

    // Create new buffer
    const newBuffer = audioCtx.createBuffer(
      fullAudioBuffer.numberOfChannels,
      frameCount,
      fullAudioBuffer.sampleRate
    );

    // Copy channel data
    for (let i = 0; i < fullAudioBuffer.numberOfChannels; i++) {
      const channelData = fullAudioBuffer.getChannelData(i);
      const newChannelData = newBuffer.getChannelData(i);
      // Safely copy subarray
      const endFrame = Math.min(startFrame + frameCount, channelData.length);
      const slice = channelData.subarray(startFrame, endFrame);
      newChannelData.set(slice);
    }

    // Export WAV
    const blob = audioBufferToWav(newBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segment_${index + 1}_${timestamp.replace(/:/g, '-')}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col px-4 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <button onClick={onReset} className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-5 h-5 mr-2" /> Voltar ao Início
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {exportOptions.map((opt) => (
            <button
              key={opt.format}
              onClick={() => generateDocument(data, opt.format, file.name)}
              className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-xl flex items-center justify-center text-xs transition-all"
            >
              <Download className="w-4 h-4 mr-2" /> {opt.label}
            </button>
          ))}
          <button
            onClick={() => generateDocument(data, 'pdf', file.name)}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            <Zap className="w-4 h-4 mr-2" /> Relatório Completo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Metadata & Quick Insights */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-6 flex items-center gap-2 tracking-widest"><Layers className="w-4 h-4" /> Diagnóstico</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Idioma Original</span>
                <span className="text-white text-sm font-medium flex items-center gap-2"><Globe className="w-3 h-3 text-blue-400" /> {data.language}</span>
              </div>
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Sentimento</span>
                <span className={`text-sm font-bold ${data.sentiment === 'Positivo' ? 'text-emerald-400' : data.sentiment === 'Negativo' ? 'text-red-400' : 'text-slate-300'}`}>
                  {data.sentiment}
                </span>
              </div>
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Tom de Voz</span>
                <span className="text-white text-sm font-medium">{data.tone}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {data.keywords.map((k, i) => (
                  <span key={i} className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">#{k}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Grounding Sources Panel */}
          {data.groundingMetadata && data.groundingMetadata.webSources.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
                <Search className="w-4 h-4" /> Fontes Verificadas
              </h3>
              <div className="space-y-3">
                {data.groundingMetadata.webSources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-blue-500/30 hover:bg-slate-800 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-slate-300 font-medium line-clamp-2">{source.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5 ml-2" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quick Export Panel */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2 tracking-widest">
              <ExternalLink className="w-4 h-4" /> Exportação Rápida
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const text = `*Resumo CogniStream - ${file.name}*\n\n*Resumo Executivo:* ${data.summary.executive}\n\n*Sentimento:* ${data.sentiment}\n\nGerado por CogniStream AI.`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                }}
                className="w-full flex items-center justify-between p-3 bg-emerald-600/10 rounded-xl border border-emerald-500/20 hover:bg-emerald-600/20 transition-all group"
              >
                <span className="text-xs text-emerald-400 font-bold uppercase">WhatsApp</span>
                <MessageSquare className="w-4 h-4 text-emerald-500" />
              </button>

              <button
                onClick={() => {
                  const md = `# Análise CogniStream: ${file.name}\n\n## Resumo Executivo\n${data.summary.executive}\n\n## Insights\n${data.summary.insights.join('\n- ')}`;
                  navigator.clipboard.writeText(md).then(() => alert("Copiado como Markdown!"));
                }}
                className="w-full flex items-center justify-between p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 hover:bg-blue-600/20 transition-all group"
              >
                <span className="text-xs text-blue-400 font-bold uppercase">Copiar Markdown</span>
                <ClipboardCheck className="w-4 h-4 text-blue-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-3 glass-panel rounded-3xl overflow-hidden flex flex-col border border-slate-800 shadow-2xl">
          <div className="flex border-b border-slate-800 bg-slate-900/50 overflow-x-auto scrollbar-hide">
            {[
              { id: 'summary', label: 'Resumo', icon: AlignLeft },
              { id: 'detailed', label: 'Análise Profunda', icon: List },
              { id: 'insights', label: 'Insights & Riscos', icon: Zap },
              { id: 'transcript', label: 'Transcrição & Áudio', icon: MessageSquare },
              { id: 'translation', label: 'Tradução', icon: Languages },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[120px] py-5 px-4 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-white bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8 overflow-y-auto max-h-[800px] bg-slate-950/20">
            {activeTab === 'summary' && (
              <div className="space-y-10 animate-fade-in">
                <section>
                  <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-1 h-8 bg-blue-500 rounded-full"></div> Resumo Executivo
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-lg bg-slate-900/40 p-6 rounded-2xl border border-slate-800">{data.summary.executive}</p>
                </section>

                <section>
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <ClipboardCheck className="w-6 h-6 text-emerald-400" /> Plano de Ação Sugerido
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.summary.actionPlan?.map((a, i) => (
                      <div key={i} className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-sm text-slate-300 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                        {a}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'detailed' && (
              <div className="space-y-10 animate-fade-in">
                <section>
                  <h4 className="text-2xl font-bold text-white mb-6">Relatório Detalhado</h4>
                  <div className="text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900/40 p-8 rounded-2xl border border-slate-800 text-base">{data.summary.detailed}</div>
                </section>

                {data.summary.technicalObservations && (
                  <section>
                    <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <Zap className="w-6 h-6 text-indigo-400" /> Observações Técnicas
                    </h4>
                    <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-slate-300 text-sm leading-relaxed italic">
                      {data.summary.technicalObservations}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-10 animate-fade-in">
                <section>
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-amber-500" /> Riscos & Oportunidades
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.summary.risksAndOpportunities?.map((r, i) => (
                      <div key={i} className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-sm text-slate-300 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/30 group-hover:bg-amber-500 transition-colors"></div>
                        {r}
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xl font-bold text-white mb-6">Insights Estratégicos</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.summary.insights.map((ins, i) => (
                      <li key={i} className="flex gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300 text-sm italic">
                        <span className="text-blue-500 font-black">#</span> {ins}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Segmentos & Áudio</h4>

                  {file.file && (
                    !fullAudioBuffer ? (
                      <button
                        onClick={handleLoadAudio}
                        disabled={audioLoading}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50"
                      >
                        {audioLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Music className="w-3 h-3" />}
                        {audioLoading ? "Processando..." : "Habilitar Recorte de Áudio"}
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        <Scissors className="w-3 h-3" /> Modo de Recorte Ativo
                      </span>
                    )
                  )}
                </div>

                {data.segments && data.segments.length > 0 ? (
                  <div className="space-y-4">
                    {data.segments.map((seg, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border transition-all ${playingSegmentId === idx ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded mb-2 inline-block">
                              {seg.timestamp}
                            </span>
                            <p className="text-slate-300 text-sm leading-relaxed">{seg.text}</p>
                          </div>

                          {fullAudioBuffer && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => playSegment(seg.timestamp, idx)}
                                className={`p-2 rounded-lg transition-colors ${playingSegmentId === idx ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600'}`}
                                title="Reproduzir"
                              >
                                <Play className={`w-4 h-4 ${playingSegmentId === idx ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={() => downloadSegment(seg.timestamp, idx)}
                                className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:text-emerald-400 hover:bg-slate-600 transition-colors"
                                title="Exportar Clipe (WAV)"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="font-mono text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{data.transcription}</div>
                )}
              </div>
            )}

            {activeTab === 'translation' && (
              <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Tradução Integral de Apoio</h4>
                <div className="text-slate-300 leading-relaxed text-base italic">{data.translation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
