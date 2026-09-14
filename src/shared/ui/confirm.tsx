"use client";

import { create } from "zustand";
import { Button } from "./button";
import { Dialog } from "./dialog";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
};

type Request = ConfirmOptions & { resolve: (confirmed: boolean) => void };

const useConfirmStore = create<{ request: Request | null }>(() => ({ request: null }));

/** Promise-based confirmation: `if (await requestConfirm({...})) remove()`. */
export function requestConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().request?.resolve(false);
    useConfirmStore.setState({ request: { ...options, resolve } });
  });
}

export function ConfirmHost() {
  const request = useConfirmStore((state) => state.request);

  const close = (confirmed: boolean) => {
    request?.resolve(confirmed);
    useConfirmStore.setState({ request: null });
  };

  return (
    <Dialog
      open={request !== null}
      onClose={() => close(false)}
      title={request?.title ?? ""}
      description={request?.description}
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={() => close(false)}>
            {request?.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            size="sm"
            variant={request?.tone === "danger" ? "signal" : "solid"}
            onClick={() => close(true)}
            autoFocus
          >
            {request?.confirmLabel ?? "Confirm"}
          </Button>
        </>
      }
    />
  );
}
