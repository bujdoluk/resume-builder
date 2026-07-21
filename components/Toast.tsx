"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { generateId } from "@/lib/generateId";

export type ToastVariant = "success" | "info" | "warning" | "error";

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const AUTO_DISMISS_MS = 5000;

const VARIANT_CLASS: Record<ToastVariant, string> = {
  success: "alert-success",
  info: "alert-info",
  warning: "alert-warning",
  error: "alert-error",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="toast toast-top toast-end z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`alert ${VARIANT_CLASS[toast.variant]} cursor-pointer`}
            onClick={() => dismiss(toast.id)}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
