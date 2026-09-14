"use client";

import * as React from "react";
import { create } from "zustand";
import { X } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { STORAGE_ERROR_EVENT } from "@/shared/lib/storage";

type Tone = "neutral" | "positive" | "danger";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
};

const useToastStore = create<{ items: ToastItem[] }>(() => ({ items: [] }));

let counter = 0;

export function dismissToast(id: number) {
  useToastStore.setState((state) => ({
    items: state.items.filter((item) => item.id !== id),
  }));
}

export function toast(title: string, options: { description?: string; tone?: Tone } = {}) {
  const id = ++counter;
  const item: ToastItem = {
    id,
    title,
    description: options.description,
    tone: options.tone ?? "neutral",
  };
  useToastStore.setState((state) => ({ items: [...state.items.slice(-2), item] }));
  window.setTimeout(() => dismissToast(id), options.tone === "danger" ? 6500 : 4000);
}

const toneBar: Record<Tone, string> = {
  neutral: "bg-panel",
  positive: "bg-positive",
  danger: "bg-signal",
};

export function Toaster() {
  const items = useToastStore((state) => state.items);

  React.useEffect(() => {
    const onStorageError = () =>
      toast("Browser storage is full", {
        tone: "danger",
        description: "The last change was not stored. Remove a large logo and save again.",
      });
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
  }, []);

  return (
    <div
      data-print="hide"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.tone === "danger" ? "alert" : "status"}
          className="toast-in pointer-events-auto flex w-full max-w-sm items-stretch border border-ink bg-ink text-panel shadow-[0_18px_40px_-18px_rgba(0,0,0,.55)]"
        >
          <span className={cn("w-1.5 shrink-0", toneBar[item.tone])} aria-hidden />
          <div className="min-w-0 flex-1 px-3.5 py-3">
            <p className="text-sm font-medium">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-micro leading-relaxed text-panel/70">
                {item.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(item.id)}
            aria-label="Dismiss notification"
            className="grid w-10 shrink-0 place-items-center text-panel/60 transition-colors hover:text-panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
