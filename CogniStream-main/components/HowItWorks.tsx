
import React from 'react';
import { Upload, BrainCircuit, FileText, Zap, Shield, Globe, ArrowRight, Eye } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const HowItWorks: React.FC<Props> = ({ onBack }) => {
  const steps = [
    {
      icon: Upload,
      title: "1. Envio de Mídia",
      desc: "Faça upload de arquivos (MP3, MP4, WAV) ou cole links diretos (YouTube, Vimeo, Web). O sistema aceita conteúdos longos e processa formatos variados."
    },
    {
      icon: BrainCircuit,
      title: "2. Processamento Neural",
      desc: "Nossa IA multimodal (Gemini 1.5) analisa áudio e vídeo simultaneamente, detectando fala, entonação, sentimento e contexto visual."
    },
    {
      icon: FileText,
      title: "3. Geração de Inteligência",
      desc: "Receba transcrições precisas, traduções automáticas e resumos estruturados (Executivo, Tópicos e Insights) prontos para exportação."
    }
  ];

  const features = [
    { icon: Zap, title: "Tempo Real", desc: "Baixa latência para transcrição e análise instantânea via microfone." },
    { icon: Eye, title: "Visão Computacional", desc: "A IA pode 'ver' seu ambiente através da câmera para assistência visual ao vivo." },
    { icon: Globe, title: "Multilíngue", desc: "Suporte a tradução e detecção automática de dezenas de idiomas." },
    { icon: Shield, title: "Segurança", desc: "Seus dados são processados de forma efêmera e segura." }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 animate-fade-in-up relative z-10">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-16 pt-8">
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Transforme Mídia em <span className="text-primary">Conhecimento</span>
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Entenda como o CogniStream utiliza inteligência artificial avançada para dissecar, resumir e traduzir seus conteúdos audiovisuais em segundos.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 relative">
        {/* Connector Line (Desktop) */}
        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-800 via-primary/50 to-slate-800 z-0"></div>
        
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-6 shadow-xl shadow-black/50 group-hover:border-primary/50 group-hover:shadow-primary/20 transition-all duration-300">
                <Icon className="w-10 h-10 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Features Section */}
      <div className="glass-panel rounded-3xl p-8 md:p-12 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="flex gap-4 items-start">
                <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{feat.title}</h4>
                  <p className="text-sm text-slate-400">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button 
          onClick={onBack}
          className="group bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-200 transition-all flex items-center mx-auto shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
        >
          Começar Análise Agora
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default HowItWorks;
