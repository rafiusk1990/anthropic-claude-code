"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "default" | "success" | "error" | "info"

interface ToastData {
  id: string
  message: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toasts: ToastData[]
  toast: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const toast = React.useCallback((message: string, variant: ToastVariant = "default") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-xl p-4 shadow-lg border text-sm",
              t.variant === "success" && "bg-green-50 border-green-200 text-green-800",
              t.variant === "error" && "bg-red-50 border-red-200 text-red-800",
              t.variant === "info" && "bg-blue-50 border-blue-200 text-blue-800",
              (!t.variant || t.variant === "default") && "bg-white border-gray-200 text-gray-800"
            )}
          >
            {t.variant === "success" && <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            {t.variant === "error" && <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            {t.variant === "info" && <Info className="h-4 w-4 shrink-0 mt-0.5" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
