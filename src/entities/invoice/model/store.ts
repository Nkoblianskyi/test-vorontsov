import { create } from "zustand";
import { persist } from "zustand/middleware";

import { browserStorage, STORAGE_KEYS } from "@/shared/lib/storage";
import { createId } from "@/shared/lib/id";
import { todayIso } from "@/shared/lib/dates";
import { computeTotals } from "../lib/totals";
import { seedInvoices } from "./samples";
import { toInvoiceInput, type InvoiceInput, type InvoiceRecord, type InvoiceStatus } from "./schema";

type InvoicesState = {
  invoices: InvoiceRecord[];
  create: (input: InvoiceInput) => InvoiceRecord;
  update: (id: string, input: InvoiceInput) => InvoiceRecord | null;
  remove: (id: string) => void;
  duplicate: (id: string, overrides: Partial<InvoiceInput>) => InvoiceRecord | null;
  setStatus: (id: string, status: InvoiceStatus) => void;
  markPaid: (id: string) => void;
  reassignTemplate: (fromId: string, toId: string) => void;
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
    (set, get) => {
      const replace = (id: string, next: (record: InvoiceRecord) => InvoiceRecord) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) => (invoice.id === id ? next(invoice) : invoice)),
        }));

      return {
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
          replace(id, () => record);
          return record;
        },

        remove: (id) =>
          set((state) => ({ invoices: state.invoices.filter((invoice) => invoice.id !== id) })),

        duplicate: (id, overrides) => {
          const source = get().invoices.find((invoice) => invoice.id === id);
          if (!source) return null;
          return get().create({
            ...toInvoiceInput(source),
            status: "draft",
            amountPaid: 0,
            ...overrides,
          });
        },

        setStatus: (id, status) =>
          replace(id, (invoice) => stamp(invoice, { ...toInvoiceInput(invoice), status })),

        markPaid: (id) =>
          replace(id, (invoice) => {
            const { total } = computeTotals(invoice);
            return stamp(invoice, { ...toInvoiceInput(invoice), status: "paid", amountPaid: total });
          }),

        reassignTemplate: (fromId, toId) =>
          set((state) => ({
            invoices: state.invoices.map((invoice) =>
              invoice.templateId === fromId ? { ...invoice, templateId: toId } : invoice,
            ),
          })),
      };
    },
    {
      name: STORAGE_KEYS.invoices,
      version: 1,
      storage: browserStorage,
      partialize: (state) => ({ invoices: state.invoices }),
    },
  ),
);

export function nextInvoiceNumber(invoices: InvoiceRecord[], prefix: string): string {
  const used = invoices
    .map((invoice) => invoice.number)
    .filter((number) => number.startsWith(prefix))
    .map((number) => Number.parseInt(number.slice(prefix.length), 10))
    .filter(Number.isFinite);
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function isNumberTaken(invoices: InvoiceRecord[], number: string, exceptId?: string) {
  const wanted = number.trim().toLowerCase();
  return invoices.some(
    (invoice) => invoice.id !== exceptId && invoice.number.trim().toLowerCase() === wanted,
  );
}
