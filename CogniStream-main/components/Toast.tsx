
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, onClose]);

  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
    error: 'bg-red-500/10 border-red-500 text-red-400',
    info: 'bg-blue-500/10 border-blue-500 text-blue-400'
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  };

  const Icon = icons[type];

  return (
    <div 
      className={`fixed top-6 right-6 z-[100] transition-all duration-300 transform ${
        show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl max-w-sm ${styles[type]}`}>
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 text-sm font-medium pr-4 leading-relaxed">
          {message}
        </div>
        <button onClick={() => setShow(false)} className="hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
