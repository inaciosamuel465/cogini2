
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, PhoneOff, Sparkles, Video, VideoOff, Monitor, XCircle } from 'lucide-react';
import { base64ToArrayBuffer, float32ToInt16, pcmToAudioBuffer, arrayBufferToBase64Safe as arrayBufferToBase64 } from '../services/audioUtils';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { saveAIMemory, getAIContextForUser } from '../services/aiMemoryService';

interface Props {
  onClose: () => void;
}

const LiveConversation: React.FC<Props> = ({ onClose }) => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [status, setStatus] = useState("Inicializando...");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  const closeRef = useRef<boolean>(false);
  const isSetupCompleteRef = useRef<boolean>(false);

  // Video/Screen Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoIntervalRef = useRef<number | null>(null);

  // Visualization Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    connectToGemini();
    return () => cleanup();
  }, []);

  // --- STREAM MANAGEMENT ---
  const stopVideoTracks = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
    }
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
  };

  const startVideoStream = async (type: 'camera' | 'screen') => {
    stopVideoTracks(); // Stop existing

    try {
      let mediaStream: MediaStream;

      if (type === 'screen') {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { max: 1280 }, height: { max: 720 } } // Cap resolution for performance
        });
      } else {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
      }

      videoStreamRef.current = mediaStream;

      // Handle stream stop (user clicks "Stop Sharing" in browser UI)
      mediaStream.getVideoTracks()[0].onended = () => {
        setIsVideoOn(false);
        setIsScreenSharing(false);
        stopVideoTracks();
      };

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      if (type === 'screen') setIsScreenSharing(true);
      else setIsVideoOn(true);

      // Start sending frames - lower rate for screen share to save tokens if needed, but 1FPS is standard
      videoIntervalRef.current = window.setInterval(() => {
        sendVideoFrame();
      }, 1000);

    } catch (e) {
      console.error("Stream Start Error:", e);
      setStatus("Erro ao iniciar vídeo");
      setIsVideoOn(false);
      setIsScreenSharing(false);
    }
  };

  const toggleCamera = () => {
    if (isVideoOn) {
      setIsVideoOn(false);
      stopVideoTracks();
    } else {
      setIsScreenSharing(false); // Mutually exclusive
      startVideoStream('camera');
    }
  };

  const toggleScreen = () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      stopVideoTracks();
    } else {
      setIsVideoOn(false); // Mutually exclusive
      startVideoStream('screen');
    }
  };

  const sendVideoFrame = async () => {
    if (!videoRef.current || !videoCanvasRef.current || !sessionRef.current || !isSetupCompleteRef.current) return;

    const video = videoRef.current;
    const canvas = videoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Downscale for token efficiency while maintaining aspect ratio
    const MAX_WIDTH = 640;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

    try {
      await sessionRef.current.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
    } catch (e) {
      console.error("Error sending frame", e);
    }
  };

  // --- CANVAS VISUALIZER ---
  useEffect(() => {
    if (!canvasRef.current || !isConnected) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;
    let phase = 0;

    const render = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width * window.devicePixelRatio) {
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      const w = width;
      const h = height;
      const centerY = h / 2;

      let amplitude = 0;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        amplitude = Math.sqrt(sum / dataArray.length) * 10;
      }

      const targetAmp = Math.max(0.1, amplitude);
      ctx.clearRect(0, 0, w, h);

      const drawWave = (color: string, speed: number, frequency: number, offset: number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let x = 0; x < w; x++) {
          const scaling = (1 - Math.pow(Math.abs(x - w / 2) / (w / 2), 2));
          const y = centerY + Math.sin(x * frequency + phase * speed + offset) * (targetAmp * 80 * scaling);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      const primaryColor = isSpeaking ? 'rgba(96, 165, 250, 0.8)' : 'rgba(52, 211, 153, 0.8)';
      const secondaryColor = isSpeaking ? 'rgba(167, 139, 250, 0.5)' : 'rgba(6, 182, 212, 0.5)';

      drawWave(primaryColor, 0.1, 0.01, 0);
      drawWave(secondaryColor, 0.15, 0.015, 2);
      drawWave(primaryColor, 0.05, 0.005, 4);

      phase += 0.2;
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isConnected, isSpeaking]);

  const cleanup = () => {
    closeRef.current = true;
    isSetupCompleteRef.current = false;
    try { stopVideoTracks(); } catch (e) { }

    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { console.log("Erro ao fechar sessão Live"); }
      sessionRef.current = null;
    }
    if (streamRef.current) { try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) { } }
    if (processorRef.current) { try { processorRef.current.disconnect(); } catch (e) { } }

    // Fechamento defensivo de contextos de áudio
    try {
      if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close().catch(e => console.log("Erro fechar input context", e));
      }
    } catch (e) { }

    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.log("Erro fechar output context", e));
      }
    } catch (e) { }

    try {
      sourceNodesRef.current.forEach(n => { try { n.stop(); } catch (e) { } });
      sourceNodesRef.current.clear();
    } catch (e) { }
  };

  const connectToGemini = async () => {
    try {
      const apiKey = settings.geminiApiKey || process.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        setStatus("Aviso: Chave de API do Gemini não configurada.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("O navegador bloqueou o microfone ou não suporta a gravação. O site precisa de conexão Segura (HTTPS) e permissão de microfone.");
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      analyserRef.current = inputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);
      const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(inputAudioContextRef.current.destination);

      const aiContext = user ? await getAIContextForUser(user.uid) : "";

      const userName = user?.displayName || "Pro";
      const isReturningUser = !!aiContext;

      const systemInstruction = `
        IDENTIDADE: Você é o "CogniStream AI", um assistente multimodal avançado.
        
        SAUDAÇÃO E PERSONALIDADE:
        - Nome do Usuário: "${userName}". Use-o sempre na saudação inicial.
        - SE o usuário está RETORNANDO (${isReturningUser ? 'SIM' : 'NÃO'}): Não se apresente formalmente. Seja direto e amigável. Diga algo como "Olá ${userName}, bom te ver de volta! O que vamos analisar hoje?" ou "Oi ${userName}, estou a postos. Como posso ajudar agora?".
        - SE for a primeira interação: Apresente-se brevemente como o CogniStream AI e pergunte como pode ajudar.

        CAPACIDADES: Você pode ouvir. Se receber imagens, significa que o usuário está compartilhando a Câmera ou a Tela do computador.
        
        MEMÓRIA E CONTEXTO DO USUÁRIO:
        ${aiContext || "Sem histórico prévio."}

        INSTRUÇÃO DE VISÃO:
        - Se vir uma tela de código: Aja como um Engenheiro Sênior (Pair Programmer). Analise bugs, sugira refatoração.
        - Se vir documentos: Aja como um Analista. Resuma ou traduza.
        - Se vir o rosto/ambiente: Seja conversacional e amigável.

        PERSONALIDADE: Profissional, concisa e altamente inteligente. Respostas diretas. Estilo de voz: ${settings.voiceTone}.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
        callbacks: {
          onopen: () => {
            console.log("WebSocket connected. Waiting for setup complete...");
            setStatus("Conectando ao núcleo...");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (closeRef.current) return;

            if (message.setupComplete) {
              console.log("Live Client Setup Complete!");
              isSetupCompleteRef.current = true;
              setStatus("Link Neural Estabelecido");
              setIsConnected(true);
              setIsSpeaking(true);
              nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
              setTimeout(() => setIsSpeaking(false), 2000);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const pcmData = new Int16Array(base64ToArrayBuffer(base64Audio));
              const audioBuffer = pcmToAudioBuffer(pcmData, audioContextRef.current, 24000);
              const ctx = audioContextRef.current;
              const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              sourceNodesRef.current.add(source);

              setIsSpeaking(true);
              source.onended = () => {
                sourceNodesRef.current.delete(source);
                if (sourceNodesRef.current.size === 0) setIsSpeaking(false);
              };
            }

            if (message.serverContent?.interrupted) {
              sourceNodesRef.current.forEach(node => { try { node.stop(); } catch (e) { } });
              sourceNodesRef.current.clear();
              if (audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
              setIsSpeaking(false);
            }

            if (message.serverContent?.turnComplete) {
              setTimeout(() => {
                if (sourceNodesRef.current.size === 0) setIsSpeaking(false);
              }, 500);
            }
          },
          onclose: (e) => {
            console.log("WebSocket connection closed inside onclose", e);
            setStatus("Desconectado");
            setIsConnected(false);
            closeRef.current = true;
            isSetupCompleteRef.current = false;

            // Salvar memória da conversa ao terminar
            if (user) {
              saveAIMemory({
                userId: user.uid,
                module: 'Conversa',
                type: 'conversation',
                content: `Interação concluída com o assistente multimodal. Atividade realizada: ${isVideoOn ? 'Câmera' : isScreenSharing ? 'Compartilhamento de Tela' : 'Apenas Áudio'}.`
              });
            }
          },
          onerror: (err) => {
            console.error("Live API Error", err);
            setStatus("Erro de Conexão");
            closeRef.current = true;
            isSetupCompleteRef.current = false;
          }
        }
      });

      sessionPromise.then(sess => { sessionRef.current = sess; });

      processor.onaudioprocess = async (e) => {
        if (isMuted || closeRef.current || !isSetupCompleteRef.current) return;

        // Ensure audio context is running
        if (inputAudioContextRef.current?.state === 'suspended') {
          await inputAudioContextRef.current.resume();
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = float32ToInt16(inputData);
        const base64Data = arrayBufferToBase64(pcm16.buffer);

        if (sessionRef.current && !closeRef.current) {
          try {
            sessionRef.current.sendRealtimeInput({
              media: {
                mimeType: 'audio/pcm;rate=16000',
                data: base64Data
              }
            });
          } catch (e) {
            console.log("WebSocket erro ao enviar áudio.");
          }
        }
      };

    } catch (error: any) {
      console.error(error);
      setStatus("Erro: " + error.message);
    }
  };

  const handleEndCall = () => {
    try {
      cleanup();
    } catch (e) { console.log("Erro durante cleanup da chamada", e); }
    onClose();
  };

  const hasVideo = isVideoOn || isScreenSharing;

  return (
    <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col items-center justify-center animate-fade-in font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black pointer-events-none"></div>
      <div className={`absolute inset-0 opacity-20 transition-all duration-1000 ${isSpeaking ? 'bg-blue-900/20' : 'bg-emerald-900/10'}`}></div>

      {/* Header */}
      <div className="absolute top-10 z-20 flex flex-col items-center gap-2">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-6 py-2 rounded-full flex items-center gap-3 shadow-xl">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-mono text-slate-300 uppercase tracking-widest">{status}</span>
        </div>
      </div>

      {/* CENTER STAGE */}
      <div className="relative z-10 w-full h-[60vh] flex items-center justify-center">

        {/* Audio Visualizer (Background) */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full max-w-4xl transition-opacity duration-500 ${hasVideo ? 'opacity-20' : 'opacity-100'}`}
          width={1200}
          height={600}
        />

        {/* Video Element (Camera or Screen) */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${hasVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
          <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)] max-w-3xl w-full aspect-video bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain ${isVideoOn ? 'transform scale-x-[-1]' : ''}`} // Mirror camera, not screen
            />
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-white font-mono">
                {isScreenSharing ? 'SCREEN SHARE' : 'LIVE VISION'}
              </span>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={videoCanvasRef} className="hidden" />

        {/* Central Icon (Only show if NO video is active) */}
        {!hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`p-6 rounded-full bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 ${isSpeaking ? 'scale-110 border-blue-500/30' : 'scale-100 border-emerald-500/30'}`}>
              <Sparkles className={`w-12 h-12 transition-colors duration-500 ${isSpeaking ? 'text-blue-400' : 'text-emerald-400'}`} />
            </div>
          </div>
        )}
      </div>

      <div className="relative z-20 h-20 text-center -mt-10 mb-10">
        <p className="text-slate-400 font-light tracking-wide animate-pulse">
          {isConnected ? (isSpeaking ? "CogniStream respondendo..." : isScreenSharing ? "Analisando sua tela..." : isVideoOn ? "Analisando ambiente..." : "Ouvindo você...") : "Inicializando sistemas..."}
        </p>
      </div>

      {/* Controls */}
      <div className="relative z-20 flex gap-6 mb-16 px-4 flex-wrap justify-center">
        {/* Mute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-6 rounded-full transition-all duration-300 backdrop-blur-md border ${isMuted
            ? 'bg-red-500/20 border-red-500 text-red-500'
            : 'bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/80 hover:border-white'
            }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`p-6 rounded-full transition-all duration-300 backdrop-blur-md border ${isVideoOn
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            : 'bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/80 hover:border-white'
            }`}
          disabled={isScreenSharing}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreen}
          className={`p-6 rounded-full transition-all duration-300 backdrop-blur-md border ${isScreenSharing
            ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
            : 'bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/80 hover:border-white'
            }`}
          disabled={isVideoOn}
        >
          {isScreenSharing ? <XCircle className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
        </button>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="p-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-300 shadow-lg hover:scale-105"
        >
          <PhoneOff className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default LiveConversation;
