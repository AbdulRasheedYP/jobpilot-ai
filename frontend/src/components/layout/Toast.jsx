import React from 'react';
import { Activity } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast?.message) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border transition-all duration-300 ${
        toast.type === 'success'
          ? 'bg-emerald-900 text-white border-emerald-700'
          : toast.type === 'error'
          ? 'bg-rose-900 text-white border-rose-700'
          : toast.type === 'warning'
          ? 'bg-amber-900 text-white border-amber-700'
          : 'bg-slate-900 text-white border-slate-700'
      }`}
    >
      <Activity className="w-5 h-5 animate-pulse text-emerald-400" />
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}
