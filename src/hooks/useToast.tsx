"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Toast, ToastOptions, ToastPosition } from '@/types';

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, title?: string, options?: ToastOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showToast = useCallback((
    message: string,
    title?: string,
    options: ToastOptions = {}
  ) => {
    const {
      variant = 'info',
      duration = 5000,
      position = 'top-right'
    } = options;

    const newToast: Toast = {
      id: generateId(),
      title,
      message,
      variant,
      duration,
      position,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast(message, title, { variant: 'success' });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast(message, title, { variant: 'error', duration: 7000 });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast(message, title, { variant: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast(message, title, { variant: 'info' });
  }, [showToast]);

  const value: ToastContextValue = {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}