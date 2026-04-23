import React from 'react';
import { Loader2, Sparkles, FileText, BrainCircuit, Zap } from 'lucide-react';
import { ProcessingState, ProcessingStage } from '../types';

interface Props {
  state: ProcessingState;
}

const ProcessingView: React.FC<Props> = ({ state }) => {
  const steps = [
    { id: ProcessingStage.UPLOADING, label: 'Enviando Mídia / Contexto', icon: FileText },
    { id: ProcessingStage.ANALYZING, label: 'Processamento Neural', icon: BrainCircuit },
    { id: ProcessingStage.COMPLETED, label: 'Gerando Documentos', icon: Sparkles },
  ];

  const getCurrentStepIndex = () => {
    if (state.stage === ProcessingStage.UPLOADING) return 0;
    if (state.stage === ProcessingStage.ANALYZING) return 1;
    if (state.stage === ProcessingStage.COMPLETED) return 2;
    return -1;
  };

  const currentIndex = getCurrentStepIndex();

  // Determine which model badge to show based on context (inferred from message or generic)
  // Since we don't pass the model type here directly, we'll show a dynamic "AI Active" badge
  
  return (
    <div className="w-full max-w-2xl mx-auto py-12 flex flex-col items-center">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
        <div className="relative bg-slate-900 p-6 rounded-full border border-primary/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
           <Loader2 className="w-16 h-16 text-primary animate-spin-slow" />
        </div>
        
        {/* Model Indicator Badge */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-full px-3 py-1 flex items-center gap-2 shadow-xl whitespace-nowrap">
           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
           <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
             <Zap className="w-3 h-3" /> GEMINI 3 ENGINE
           </span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Processando Conteúdo</h2>
      <p className="text-slate-400 mb-8 text-center max-w-md animate-pulse">{state.message}</p>

      <div className="w-full space-y-4">
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          const Icon = step.icon;

          return (
            <div 
              key={step.id}
              className={`flex items-center p-4 rounded-xl border transition-all duration-500 ${
                isActive 
                  ? 'bg-primary/10 border-primary/50 translate-x-2' 
                  : isCompleted 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                    : 'bg-transparent border-transparent opacity-30'
              }`}
            >
              <div className={`p-2 rounded-lg mr-4 ${isActive ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className={`font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              {isActive && (
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              )}
              {isCompleted && (
                 <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingView;
