"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { ConfirmDialog, DialogVariant } from '@/components/ConfirmDialog';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmText: string;
  cancelText: string;
  showCancel: boolean;
  onConfirm: (() => void) | null;
}

type OpenDialogOptions = Partial<Omit<ConfirmDialogState, 'isOpen' | 'onConfirm' | 'title' | 'message'>>;

interface ConfirmDialogContextValue extends ConfirmDialogState {
  openDialog: (title: string, message: string, onConfirm: () => void, options?: OpenDialogOptions) => void;
  closeDialog: () => void;
  showAlert: (title: string, message: string, variant?: DialogVariant) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'confirm',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    showCancel: true,
    onConfirm: null,
  });

  const openDialog = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: OpenDialogOptions
  ) => {
    setState({
      isOpen: true,
      title,
      message,
      onConfirm,
      variant: options?.variant || 'confirm',
      confirmText: options?.confirmText || 'Ya, Lanjutkan',
      cancelText: options?.cancelText || 'Batal',
      showCancel: options?.showCancel ?? true,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  }, []);

  const showAlert = useCallback((
    title: string,
    message: string,
    variant: DialogVariant = 'info'
  ) => {
    setState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {},
      variant,
      confirmText: 'OK',
      cancelText: 'Batal',
      showCancel: false,
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showAlert(title, message, 'success');
  }, [showAlert]);

  const showError = useCallback((title: string, message: string) => {
    showAlert(title, message, 'error');
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string) => {
    showAlert(title, message, 'warning');
  }, [showAlert]);

  const value: ConfirmDialogContextValue = {
    ...state,
    openDialog,
    closeDialog,
    showAlert,
    showSuccess,
    showError,
    showWarning,
  };

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        isOpen={state.isOpen}
        onClose={closeDialog}
        onConfirm={state.onConfirm || undefined}
        title={state.title}
        message={state.message}
        variant={state.variant}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        showCancel={state.showCancel}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return ctx;
}
