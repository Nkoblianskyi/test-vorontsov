import {
  displayStatus,
  isOpenStatus,
  type DisplayStatus,
} from "@/entities/invoice/lib/status";
import { computeTotals, type InvoiceTotals } from "@/entities/invoice/lib/totals";
import type { InvoiceRecord } from "@/entities/invoice/model/schema";
import type { Currency } from "@/shared/lib/format";

export type InvoiceRow = {
  invoice: InvoiceRecord;
  totals: InvoiceTotals;
  status: DisplayStatus;
};

export type InvoiceFilter = "all" | "draft" | "open" | "overdue" | "paid";

export const invoiceFilters: {
  value: InvoiceFilter;
  label: string;
  match: (status: DisplayStatus) => boolean;
}[] = [
  { value: "all", label: "All", match: () => true },
  { value: "draft", label: "Drafts", match: (status) => status === "draft" },
  { value: "open", label: "Outstanding", match: isOpenStatus },
  { value: "overdue", label: "Overdue", match: (status) => status === "overdue" },
  { value: "paid", label: "Paid", match: (status) => status === "paid" },
];

/** Newest first; totals and the calendar-aware status are computed once per row. */
export function buildRows(invoices: InvoiceRecord[], today: string): InvoiceRow[] {
  return invoices
    .map((invoice) => {
      const totals = computeTotals(invoice);
      return { invoice, totals, status: displayStatus(invoice, totals.balance, today) };
    })
    .sort(
      (a, b) =>
        b.invoice.issueDate.localeCompare(a.invoice.issueDate) ||
        b.invoice.number.localeCompare(a.invoice.number),
    );
}

export function matchesQuery(row: InvoiceRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const { number, customer } = row.invoice;
  return [number, customer.name, customer.email].some((text) =>
    text.toLowerCase().includes(needle),
  );
}

export type Amount = { currency: Currency; amount: number };

/** Money in different currencies is never added together: one entry per currency. */
export function sumByCurrency(
  rows: InvoiceRow[],
  pick: (row: InvoiceRow) => number,
  primary: Currency,
): Amount[] {
  const sums = new Map<Currency, number>();
  for (const row of rows) {
    sums.set(row.invoice.currency, (sums.get(row.invoice.currency) ?? 0) + pick(row));
  }
  return [...sums.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) =>
      a.currency === primary ? -1 : b.currency === primary ? 1 : b.amount - a.amount,
    );
}
