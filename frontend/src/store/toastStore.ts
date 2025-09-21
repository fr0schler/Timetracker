import { create } from 'zustand';
import { ToastData, ToastType } from '../components/ToastContainer';

interface ToastStore {
  toasts: ToastData[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (type, title, message, duration = 5000) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type,
          title,
          message,
          duration,
        },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clearAllToasts: () =>
    set({ toasts: [] }),
}));

// Helper functions for easy usage
export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast('success', title, message, duration),

  error: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast('error', title, message, duration),

  warning: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast('warning', title, message, duration),

  info: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast('info', title, message, duration),
};