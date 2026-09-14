"use client";

import { ArrowLeft, Check, Copy, Printer, Send, Trash2 } from "lucide-react";

import { InvoiceStatusBadge } from "@/entities/invoice/ui/status-badge";
import { cn } from "@/shared/lib/cn";
import { formatTimestamp } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import type { InvoiceEditorApi } from "../model/use-invoice-editor";

/** Title, save state and the one next step the invoice's status allows. */
export function EditorTopbar({ editor }: { editor: InvoiceEditorApi }) {
  const { existing, status, dirty, leave, commit, markPaid, remove, duplicate } = editor;
  const sent = Boolean(existing) && existing?.status !== "draft";

  return (
    <header
      data-print="hide"
      className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-rule-strong bg-panel px-2 sm:px-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => leave("/invoices")}
          aria-label="Back to invoices"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="tnum truncate text-sm font-semibold tracking-tight">
              {existing ? existing.number : "New invoice"}
            </h1>
            {status ? <InvoiceStatusBadge status={status} /> : null}
          </div>
          <p role="status" className="truncate text-micro text-ink-faint">
            {dirty ? (
              <span className="text-signal">
                {existing ? "Unsaved changes" : "Not saved yet"}
              </span>
            ) : existing ? (
              `Saved ${formatTimestamp(existing.updatedAt)}`
            ) : (
              "Draft"
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {existing ? (
          <div className="hidden border border-rule sm:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={duplicate}
              aria-label="Duplicate invoice"
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={remove}
              aria-label="Delete invoice"
              title="Delete"
              className="border-l border-rule hover:text-signal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <Button
          size="sm"
          variant="ghost"
          className="hidden md:inline-flex"
          onClick={() => window.print()}
        >
          <Printer className="h-3.5 w-3.5" />
          Print / PDF
        </Button>

        <Button
          size="sm"
          variant={sent ? "solid" : "outline"}
          onClick={() => commit(null)}
          disabled={Boolean(existing) && !dirty}
          className={cn(sent && !dirty && "hidden sm:inline-flex")}
        >
          {existing ? "Save" : "Save draft"}
        </Button>

        {!sent ? (
          <Button size="sm" variant="solid" onClick={() => commit("sent")}>
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {existing ? "Mark as sent" : "Save & mark sent"}
            </span>
            <span className="sm:hidden">Send</span>
          </Button>
        ) : status && status !== "paid" ? (
          <Button size="sm" variant="solid" onClick={markPaid}>
            <Check className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mark as paid</span>
            <span className="sm:hidden">Paid</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
