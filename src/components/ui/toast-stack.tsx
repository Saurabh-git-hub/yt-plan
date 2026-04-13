"use client";

import { CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  message: string;
  type?: "success" | "info" | "error";
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function ToastIcon({ type }: { type: ToastItem["type"] }) {
  if (type === "success") {
    return <CheckCircle2 size={16} className="text-lime-300" />;
  }

  if (type === "error") {
    return <TriangleAlert size={16} className="text-rose-300" />;
  }

  return <Info size={16} className="text-cyan-300" />;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start gap-2 rounded-xl border bg-[#0d1410]/95 px-3 py-2.5 text-sm text-zinc-100 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl",
            toast.type === "success" && "border-lime-300/35",
            toast.type === "error" && "border-rose-400/40",
            (!toast.type || toast.type === "info") && "border-cyan-300/30",
          )}
          role="status"
          aria-live="polite"
        >
          <ToastIcon type={toast.type} />
          <p className="flex-1 leading-5">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="rounded px-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
            aria-label="Dismiss"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
