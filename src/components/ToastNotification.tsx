"use client";

import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useEffect } from 'react';
import { Toast } from '@/types';

interface ToastNotificationProps extends Toast {
  onClose: () => void;
}

export function ToastNotification({
  title,
  message,
  variant = 'info',
  duration = 5000,
  onClose,
}: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variantConfig = {
    success: {
      icon: <CheckCircle className="h-5 w-5" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    error: {
      icon: <XCircle className="h-5 w-5" />,
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-800 dark:text-rose-300',
      iconColor: 'text-rose-600 dark:text-rose-400'
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    info: {
      icon: <Info className="h-5 w-5" />,
      bg: 'bg-cyan-50 dark:bg-cyan-950/20',
      border: 'border-cyan-200 dark:border-cyan-800',
      text: 'text-cyan-800 dark:text-cyan-300',
      iconColor: 'text-cyan-600 dark:text-cyan-400'
    }
  };

  const config = variantConfig[variant];

  return (
    <div className={`
      relative w-full max-w-sm p-4 rounded-xl border shadow-lg
      ${config.bg} ${config.border} ${config.text}
      animate-slide-in-right
    `}>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className={`${config.iconColor} flex-shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="font-bold text-sm mb-1">{title}</h4>
          )}
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}