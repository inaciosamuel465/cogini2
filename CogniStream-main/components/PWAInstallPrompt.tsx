
import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-full max-w-sm px-4 animate-fade-in-up">
      <div className="bg-slate-800/90 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl">
                <Download className="w-5 h-5 text-white" />
            </div>
            <div>
                <h4 className="text-white font-bold text-sm">Instalar App</h4>
                <p className="text-slate-400 text-xs">Adicione à tela inicial para melhor performance.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowPrompt(false)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
            <button 
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            >
                Instalar
            </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
