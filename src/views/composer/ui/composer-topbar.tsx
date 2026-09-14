"use client";

import { ArrowLeft, Check, Command, Printer, Search, Send, Sparkles } from "lucide-react";

import { isOpenStatus } from "@/entities/invoice/lib/status";
import { InvoiceStatusBadge } from "@/entities/invoice/ui/status-badge";
import type { InvoiceEditorApi } from "@/features/invoice-editor/model/use-invoice-editor";
import { firstErrorMessage } from "@/shared/lib/form-errors";
import { formatTimestamp } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";

function SaveStatus({ editor }: { editor: InvoiceEditorApi }) {
  const { saveState, record, dirty, form } = editor;
  const error = firstErrorMessage(form.formState.errors);

  if (saveState === "invalid") {
    return (
      <p role="status" className="truncate text-micro text-signal">
        Not saved · {error ?? "check the highlighted fields"}
      </p>
    );
  }
  if (saveState === "saving" || (dirty && record)) {
    return (
      <p role="status" className="text-micro text-ink-faint">
        Saving…
      </p>
    );
  }
  if (record) {
    return (
      <p
        role="status"
        className="flex items-center gap-1 truncate text-micro text-ink-faint"
      >
        <Check className="h-3 w-3 text-positive" aria-hidden />
        Saved {formatTimestamp(record.updatedAt)}
      </p>
    );
  }
  return (
    <p role="status" className="truncate text-micro text-ink-faint">
      New draft · saves itself once it has a customer
    </p>
  );
}

/** Composer header: where you are, whether it is saved, and the one next step. */
export function ComposerTopbar({
  editor,
  modKey,
  onOpenPalette,
}: {
  editor: InvoiceEditorApi;
  modKey: string;
  onOpenPalette: () => void;
}) {
  const { record, status, values, leave, commit, markPaid } = editor;
  const draft = !record || record.status === "draft";

  return (
    <header
      data-print="hide"
      className="flex h-14 shrink-0 items-center gap-2 border-b border-rule-strong bg-panel px-2 sm:px-3"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => leave("/invoices")}
        aria-label="Exit the composer"
        title="Back to the app"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="hidden items-center gap-2 pr-1 sm:flex">
        <Sparkles className="h-4 w-4 text-signal" aria-hidden />
        <span className="text-sm font-semibold tracking-tight">Composer</span>
      </div>
      <span className="hidden h-6 w-px bg-rule sm:block" aria-hidden />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="tnum truncate text-sm font-semibold tracking-tight">
            {values.number || "New invoice"}
          </p>
          {status ? <InvoiceStatusBadge status={status} /> : null}
        </div>
        <SaveStatus editor={editor} />
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        className="hidden h-9 w-64 items-center gap-2 border border-rule bg-panel-sunken px-3 text-[0.8125rem] text-ink-faint transition-colors hover:border-ink hover:text-ink lg:flex"
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span className="flex-1 text-left">Search or run a command</span>
        <kbd className="border border-rule px-1 font-sans text-micro">{modKey}K</kbd>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenPalette}
        aria-label="Commands"
      >
        <Command className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="hidden md:inline-flex"
        onClick={() => window.print()}
      >
        <Printer className="h-3.5 w-3.5" />
        Print
      </Button>

      {draft ? (
        <Button size="sm" variant="solid" onClick={() => commit("sent")}>
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Mark as sent</span>
          <span className="sm:hidden">Send</span>
        </Button>
      ) : status && isOpenStatus(status) ? (
        <Button size="sm" variant="solid" onClick={markPaid}>
          <Check className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Mark as paid</span>
          <span className="sm:hidden">Paid</span>
        </Button>
      ) : null}
    </header>
  );
}
