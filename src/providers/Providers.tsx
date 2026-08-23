"use client";

import { ConfirmDialogProvider } from '@/hooks/useConfirmDialog';
import { ToastProvider } from '@/hooks/useToast';
import { ToastRenderer } from '@/components/ToastRenderer';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        {children}
        <ToastRenderer />
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}