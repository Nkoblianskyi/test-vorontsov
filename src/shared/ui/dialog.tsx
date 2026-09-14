"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/**
 * Native <dialog>: focus trap, Esc, inert background and top-layer stacking come
 * from the browser, so the demo needs no extra dependency for modals.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[min(92vw,460px)] border border-ink bg-panel p-0 text-ink backdrop:bg-black/45",
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold tracking-tight">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 grid h-8 w-8 shrink-0 place-items-center text-ink-soft hover:bg-panel-sunken hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          {children ? <div className="min-h-0 overflow-y-auto px-5 py-4">{children}</div> : null}
          {footer ? (
            <footer className="flex justify-end gap-2 border-t border-rule bg-panel-sunken px-5 py-3">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
