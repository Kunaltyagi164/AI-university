"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle, XCircle, Info, Zap, TrendingUp } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "xp" | "levelup";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onRemove, 300);
    }, toast.duration ?? 3500);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [toast.duration, onRemove]);

  const configs: Record<ToastType, { icon: React.ReactNode; accent: string; bg: string }> = {
    success: {
      icon: <CheckCircle className="h-5 w-5 shrink-0" />,
      accent: "text-emerald-400",
      bg: "border-emerald-500/30 bg-emerald-950/40",
    },
    error: {
      icon: <XCircle className="h-5 w-5 shrink-0" />,
      accent: "text-red-400",
      bg: "border-red-500/30 bg-red-950/40",
    },
    info: {
      icon: <Info className="h-5 w-5 shrink-0" />,
      accent: "text-cyan-400",
      bg: "border-cyan-500/30 bg-cyan-950/40",
    },
    xp: {
      icon: <Zap className="h-5 w-5 shrink-0" />,
      accent: "text-amber-400",
      bg: "border-amber-500/30 bg-amber-950/40",
    },
    levelup: {
      icon: <TrendingUp className="h-5 w-5 shrink-0" />,
      accent: "text-purple-400",
      bg: "border-purple-500/30 bg-purple-950/40",
    },
  };

  const { icon, accent, bg } = configs[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl
        transition-all duration-300 ease-out max-w-sm w-full
        ${bg} ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      <span className={accent}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${accent}`}>{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(onRemove, 300); }}
        className="text-gray-500 hover:text-gray-300 cursor-pointer shrink-0 mt-0.5 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
