"use client";

import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export type DialogVariant = 'confirm' | 'alert' | 'success' | 'error' | 'warning' | 'info' | 'danger';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  loading?: boolean;
}

const variantConfig: Record<DialogVariant, { icon: React.ReactNode; bg: string; iconBg: string; confirmBg: string; confirmHover: string }> = {
  confirm: { icon: <AlertTriangle size={24} />, bg: 'bg-white dark:bg-[#0f172a]', iconBg: 'bg-blue-100 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-400', confirmBg: 'bg-blue-600', confirmHover: 'hover:bg-blue-700 dark:hover:bg-cyan-400' },
  alert: { icon: <Info size={24} />, bg: 'bg-white dark:bg-[#0f172a]', iconBg: 'bg-blue-100 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-400', confirmBg: 'bg-blue-600', confirmHover: 'hover:bg-blue-700 dark:hover:bg-cyan-400' },
  success: { icon: <CheckCircle size={24} />, bg: 'bg-white dark:bg-[#0f172a]', iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', confirmBg: 'bg-emerald-600', confirmHover: 'hover:bg-emerald-700 dark:hover:bg-emerald-400' },
  error: { icon: <XCircle size={24} />, bg: 'bg-white dark:bg-[#0f172a]', iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400', confirmBg: 'bg-rose-600', confirmHover: 'hover:bg-rose-700 dark:hover:bg-rose-400' },
  warning: { icon: <AlertTriangle size={24} />, bg: 'bg-white dark:bg-[#0f172a]', iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', confirmBg: 'bg-amber-600', confirmHover: 'hover:bg-amber-700 dark:hover:bg-amber-400' },
  info: { icon: <Info size={24} />, bg: 'bg-white dark:bg-[#0f172a]', iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400', confirmBg: 'bg-cyan-600', confirmHover: 'hover:bg-cyan-700 dark:hover:bg-cyan-400' },
  danger: { icon: <XCircle size={24} />, bg: 'bg-white dark:bg-[#0f172a]', iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400', confirmBg: 'bg-rose-600', confirmHover: 'hover:bg-rose-700 dark:hover:bg-rose-400' },
};

export function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  variant = 'confirm',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  showCancel = true,
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];

  const handleConfirm = async () => {
    if (onConfirm) await onConfirm();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="dialog-title"
      onKeyDown={handleKeyDown}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border transform transition-transform scale-100 ${config.bg} border-gray-200 dark:border-slate-700`}
      >
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${config.iconBg}`}>
            {config.icon}
          </div>
          <h3 id="dialog-title" className="text-lg font-black tracking-tight mb-2 text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">{message}</p>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-[#111827]">
          {showCancel && (
            <button 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border bg-white border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={handleConfirm} 
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm text-white ${config.confirmBg} ${config.confirmHover} disabled:opacity-50`}
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
