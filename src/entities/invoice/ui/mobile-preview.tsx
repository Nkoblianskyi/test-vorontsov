"use client";

import * as React from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/shared/ui/button";

/**
 * Phones get the form full-width; the sheet lives one tap away. The bar stays
 * pinned to the bottom so the preview is always reachable while typing.
 */
export function MobilePreviewBar({
  children,
  onOpen,
}: {
  children: React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <div
      data-print="hide"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-rule-strong bg-panel px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-20px_rgba(0,0,0,.5)] lg:hidden"
    >
      <div className="min-w-0">{children}</div>
      <Button variant="solid" onClick={onOpen}>
        <Eye className="h-4 w-4" />
        Preview
      </Button>
    </div>
  );
}

/** Full-screen preview for narrow screens. Closes itself when the window grows to desktop. */
export function MobilePreviewSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) onClose();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open, onClose]);

  return (
    <dialog
      ref={ref}
      data-print="hide"
      aria-label="Preview"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-canvas p-0 text-ink backdrop:bg-transparent lg:hidden"
    >
      {open ? (
        <div className="flex h-full flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-rule-strong bg-panel px-3">
            <div className="min-w-0">{title}</div>
            <Button size="sm" variant="solid" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
          </header>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
