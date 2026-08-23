"use client";

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { ToastNotification } from '@/components/ToastNotification';

export function ToastRenderer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toastElements = toasts.map((toast) => (
    <ToastNotification
      key={toast.id}
      {...toast}
      onClose={() => removeToast(toast.id)}
    />
  ));

  // Position toasts at top-right
  return createPortal(
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 w-full max-w-sm">
      {toastElements}
    </div>,
    document.body
  );
}