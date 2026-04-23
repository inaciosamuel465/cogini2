
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, LogIn } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const AuthModal: React.FC<Props> = ({ onClose }) => {
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao fazer login. Verifique o console.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
           <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
              <LogIn className="w-8 h-8 text-white" />
           </div>
           <h2 className="text-2xl font-bold text-white">Acesse sua Conta</h2>
           <p className="text-slate-400 mt-2">Salve seus relatórios e acesse o histórico em qualquer dispositivo.</p>
        </div>

        <button 
           onClick={handleLogin}
           className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors shadow-xl"
        >
           <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
           Entrar com Google
        </button>
        
        <p className="text-xs text-center text-slate-500 mt-6">
           Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
