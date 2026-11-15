import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toast: { id: number; message: string; type: 'info' | 'success' | 'warning' | 'error' } | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgStyles = {
    info: 'bg-zinc-900 border-zinc-700 text-zinc-100',
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    warning: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
    error: 'bg-red-950/90 border-red-500/40 text-red-200'
  }[toast.type];

  const Icon = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle
  }[toast.type];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md px-2 pointer-events-none transition-all duration-300">
      <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${bgStyles}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium flex-1 break-words leading-tight">{toast.message}</span>
        <button
          onClick={onClose}
          className="p-1 -mr-1 rounded-lg hover:bg-white/10 active:scale-95 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
