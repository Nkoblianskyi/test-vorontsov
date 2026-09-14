import { create } from "zustand";
import { persist } from "zustand/middleware";

import { browserStorage, STORAGE_KEYS } from "@/shared/lib/storage";
import { createId } from "@/shared/lib/id";
import { addDays, daysBetween, todayIso } from "@/shared/lib/dates";
import { computeTotals } from "../lib/totals";
import { seedInvoices } from "./samples";
import {
  isInvoiceRecord,
  toInvoiceInput,
  type InvoiceInput,
  type InvoiceRecord,
} from "./schema";

type InvoicesState = {
  invoices: InvoiceRecord[];
  create: (input: InvoiceInput) => InvoiceRecord;
  update: (id: string, input: InvoiceInput) => InvoiceRecord | null;
  remove: (id: string) => void;
  /** A fresh draft: next number, today's date, the same payment terms, nothing paid. */
  duplicate: (id: string, prefix: string) => InvoiceRecord | null;
  markPaid: (id: string) => void;
  reassignTemplate: (fromId: string, toId: string) => void;
  reset: () => void;
};

/** Timestamps follow the status: first time sent, first time paid. */
function stamp(previous: InvoiceRecord | null, input: InvoiceInput): InvoiceRecord {
  const now = new Date().toISOString();
  return {
    ...structuredClone(input),
    id: previous?.id ?? createId("inv_"),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    sentAt: input.status === "draft" ? null : (previous?.sentAt ?? now),
    paidAt: input.status === "paid" ? (previous?.paidAt ?? now) : null,
  };
}

export const useInvoicesStore = create<InvoicesState>()(
  persist(
    (set, get) => ({
      invoices: seedInvoices(todayIso()),

      create: (input) => {
        const record = stamp(null, input);
        set((state) => ({ invoices: [record, ...state.invoices] }));
        return record;
      },

      update: (id, input) => {
        const existing = get().invoices.find((invoice) => invoice.id === id);
        if (!existing) return null;
        const record = stamp(existing, input);
        set((state) => ({
          invoices: state.invoices.map((invoice) => (invoice.id === id ? record : invoice)),
        }));
        return record;
      },

      remove: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
        })),

      duplicate: (id, prefix) => {
        const { invoices, create } = get();
        const source = invoices.find((invoice) => invoice.id === id);
        if (!source) return null;
        const issueDate = todayIso();
        const termDays = Math.max(0, daysBetween(source.issueDate, source.dueDate));
        return create({
          ...toInvoiceInput(source),
          status: "draft",
          amountPaid: 0,
          number: nextInvoiceNumber(invoices, prefix),
          issueDate,
          dueDate: addDays(issueDate, termDays),
        });
      },

      markPaid: (id) => {
        const invoice = get().invoices.find((item) => item.id === id);
        if (!invoice) return;
        const { total } = computeTotals(invoice);
        get().update(id, { ...toInvoiceInput(invoice), status: "paid", amountPaid: total });
      },

      reassignTemplate: (fromId, toId) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.templateId === fromId ? { ...invoice, templateId: toId } : invoice,
          ),
        })),

      reset: () => set({ invoices: seedInvoices(todayIso()) }),
    }),
    {
      name: STORAGE_KEYS.invoices,
      version: 1,
      storage: browserStorage,
      partialize: (state) => ({ invoices: state.invoices }),
      // Stored data can be stale or hand-edited: keep only records that still validate.
      merge: (persisted, current) => {
        const saved = (persisted as { invoices?: unknown } | undefined)?.invoices;
        return Array.isArray(saved)
          ? { ...current, invoices: saved.filter(isInvoiceRecord) }
          : current;
      },
    },
  ),
);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Next number in the prefix's sequence. Only `PREFIX` + digits counts: "INV-2026-0042" does not. */
export function nextInvoiceNumber(invoices: InvoiceRecord[], prefix: string): string {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`);
  const used = invoices.flatMap((invoice) => {
    const match = pattern.exec(invoice.number.trim());
    return match ? [Number(match[1])] : [];
  });
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function isNumberTaken(
  invoices: InvoiceRecord[],
  number: string,
  exceptId?: string,
) {
  const wanted = number.trim().toLowerCase();
  return invoices.some(
    (invoice) => invoice.id !== exceptId && invoice.number.trim().toLowerCase() === wanted,
  );
}
