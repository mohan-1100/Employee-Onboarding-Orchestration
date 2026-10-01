import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl ${
        isSuccess 
          ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/50' 
          : isError
          ? 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-950/50'
          : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-black/50'
      }`}>
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
        {isError && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />}

        <div className="text-xs">
          <p className="font-semibold">{toast.title || (isSuccess ? 'Success' : 'Notice')}</p>
          <p className="opacity-90">{toast.message}</p>
        </div>

        <button 
          onClick={onClose}
          className="ml-2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
