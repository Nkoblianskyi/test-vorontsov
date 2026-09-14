"use client";

import { useEffect, useRef } from "react";

/**
 * Drives a native <dialog> from React state: `showModal()` gives focus trapping,
 * Esc handling and an inert page for free.
 */
export function useModalDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return ref;
}
