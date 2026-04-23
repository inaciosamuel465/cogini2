
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, FileText, ListFilter } from 'lucide-react';
import { UploadedFile, AnalysisMode } from '../types';

interface Props {
  onRecordingComplete: (file: UploadedFile) => void;
  onCancel: () => void;
}

const Recorder: React.FC<Props> = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState<AnalysisMode>('detailed'); // Default to detailed based on request
  const [isStopping, setIsStopping] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | undefined>(undefined);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const currentChunks = [...chunksRef.current];
        const blob = new Blob(currentChunks, { type: 'audio/webm' });
        const file = new File([blob], `gravacao_${new Date().getTime()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        // Limpeza do stream antes de notificar o pai
        stream.getTracks().forEach(track => track.stop());

        // Aumento do delay para garantir que o React processe o estado 
        // de parada do MediaRecorder antes de tentar desmontar o componente,
        // prevenindo o erro "removeChild" em navegadores Webkit/Chromium.
        setTimeout(() => {
          onRecordingComplete({
            file,
            url,
            type: 'audio',
            name: file.name,
            analysisMode: mode
          });
        }, 100);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone.");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isStopping) {
      setIsStopping(true);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full flex flex-col items-center relative overflow-hidden shadow-2xl">

        {/* Animated Background Ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full border-4 border-red-500/20 animate-ping opacity-20"></div>
        </div>

        <div className="relative z-10 bg-red-500/10 p-6 rounded-full mb-6 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <Mic className="w-12 h-12 text-red-500" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">Gravando Áudio</h3>
        <div className="text-4xl font-mono text-slate-200 mb-8 font-bold tracking-widest">
          {formatTime(duration)}
        </div>

        {/* Mode Selector */}
        <div className="w-full bg-slate-800 p-1.5 rounded-xl flex mb-8 border border-slate-700">
          <button
            onClick={() => setMode('concise')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'concise' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ListFilter className="w-4 h-4" /> Resumo
          </button>
          <button
            onClick={() => setMode('detailed')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'detailed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-4 h-4" /> Conteúdo Total
          </button>
        </div>

        <div className="flex w-full gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={stopRecording}
            className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg hover:shadow-red-600/30"
          >
            {isStopping ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
            ) : (
              <><Square className="w-4 h-4 mr-2 fill-current" /> {mode === 'detailed' ? 'Finalizar (Total)' : 'Finalizar (Resumo)'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recorder;
