
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface Step {
    targetId: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const steps: Step[] = [
    {
        targetId: 'step-analyze',
        title: 'Análise Profunda',
        content: 'Aqui você pode subir arquivos de áudio, vídeo ou links para análise com verificação de fatos via Google Search.',
        position: 'bottom'
    },
    {
        targetId: 'step-sjl',
        title: 'SJL Neural Link',
        content: 'Treine seu inglês corporativo com nossa instrutora IA que explica palavra por palavra.',
        position: 'top'
    },
    {
        targetId: 'step-translator',
        title: 'Tradutor Neural',
        content: 'Tradução simultânea em tempo real para suas reuniões internacionais.',
        position: 'bottom'
    },
    {
        targetId: 'step-profile',
        title: 'Seu Perfil',
        content: 'Personalize como a IA fala com você e acompanhe seu XP e medalhas.',
        position: 'left'
    }
];

const WelcomeTour: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
        const updateCoords = () => {
            const target = document.getElementById(steps[currentStep].targetId);
            if (target) {
                const rect = target.getBoundingClientRect();
                // Usamos diretamente rect pois o tour é fixed (coordenadas da viewport)
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Se o elemento não existe (ex: usuário deslogado), pula ou finaliza
                if (currentStep < steps.length - 1) {
                    setCurrentStep(currentStep + 1);
                } else {
                    onComplete();
                }
            }
        };

        const timer = setTimeout(updateCoords, 150);
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords);
        };
    }, [currentStep, onComplete]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    if (coords.width === 0) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-auto transition-all duration-500"
                style={{
                    clipPath: `polygon(
                        0% 0%, 0% 100%, 
                        ${coords.left}px 100%, 
                        ${coords.left}px ${coords.top}px, 
                        ${coords.left + coords.width}px ${coords.top}px, 
                        ${coords.left + coords.width}px ${coords.top + coords.height}px, 
                        ${coords.left}px ${coords.top + coords.height}px, 
                        ${coords.left}px 100%, 
                        100% 100%, 100% 0%
                    )`
                }}
                onClick={onComplete}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute z-[210] pointer-events-auto p-6 bg-slate-900 border border-blue-500/30 rounded-[2rem] shadow-2xl shadow-blue-900/40 w-[280px] md:w-[350px]"
                    style={{
                        top: coords.top > window.innerHeight / 2 ? coords.top - 240 : coords.top + coords.height + 20,
                        left: Math.max(20, Math.min(window.innerWidth - 370, coords.left + (coords.width / 2) - 175)),
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-yellow-500 w-4 h-4" />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Guia Cognitivo</span>
                        </div>
                        <button onClick={onComplete} className="text-slate-500 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <h3 className="text-white font-black text-lg mb-2 uppercase tracking-tight">{steps[currentStep].title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6">
                        {steps[currentStep].content}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-6 bg-blue-500' : 'w-2 bg-slate-800'}`}></div>
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
                        >
                            {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'} <ChevronRight size={14} />
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div
                className="absolute border-2 border-blue-500 rounded-2xl animate-pulse transition-all duration-500 pointer-events-none"
                style={{
                    top: coords.top - 4,
                    left: coords.left - 4,
                    width: coords.width + 8,
                    height: coords.height + 8
                }}
            />
        </div>
    );
};

export default WelcomeTour;
