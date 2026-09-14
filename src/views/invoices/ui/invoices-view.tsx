"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, FileText, Plus, Search, Trash2 } from "lucide-react";

import { useCompanyStore } from "@/entities/company/model/store";
import { computeTotals, type InvoiceTotals } from "@/entities/invoice/lib/totals";
import {
  displayStatus,
  isOpenStatus,
  statusMeta,
  type DisplayStatus,
} from "@/entities/invoice/lib/status";
import type { InvoiceRecord } from "@/entities/invoice/model/schema";
import { nextInvoiceNumber, useInvoicesStore } from "@/entities/invoice/model/store";
import { addDays, daysBetween, todayIso } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatMoney, type Currency } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { requestConfirm } from "@/shared/ui/confirm";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { toast } from "@/shared/ui/toast";

type Row = { invoice: InvoiceRecord; totals: InvoiceTotals; status: DisplayStatus };
type Filter = "all" | "draft" | "open" | "overdue" | "paid";

const filters: { value: Filter; label: string; match: (status: DisplayStatus) => boolean }[] = [
  { value: "all", label: "All", match: () => true },
  { value: "draft", label: "Drafts", match: (status) => status === "draft" },
  { value: "open", label: "Outstanding", match: isOpenStatus },
  { value: "overdue", label: "Overdue", match: (status) => status === "overdue" },
  { value: "paid", label: "Paid", match: (status) => status === "paid" },
];

type Amount = { currency: Currency; amount: number };

/** Money in different currencies is never added together: one line per currency. */
function sumByCurrency(rows: Row[], pick: (row: Row) => number, primary: Currency): Amount[] {
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

function Kpi({
  label,
  amounts,
  currency,
  caption,
  signal,
}: {
  label: string;
  amounts: Amount[];
  currency: Currency;
  caption: string;
  signal?: boolean;
}) {
  const [first, ...rest] = amounts.length ? amounts : [{ currency, amount: 0 }];
  return (
    <div className="flex flex-col bg-panel p-4 sm:p-5">
      <p className="field-label uppercase tracking-[0.08em]">{label}</p>
      <p
        className={cn(
          "tnum mt-2 text-[1.375rem] leading-tight font-semibold tracking-tight sm:text-2xl",
          signal && first.amount > 0 && "text-signal",
        )}
      >
        {formatMoney(first.amount, first.currency)}
      </p>
      {rest.map((item) => (
        <p key={item.currency} className="tnum text-micro text-ink-soft">
          + {formatMoney(item.amount, item.currency)}
        </p>
      ))}
      <p className="mt-auto pt-2 text-micro text-ink-faint">{caption}</p>
    </div>
  );
}

function DueCell({ row, today }: { row: Row; today: string }) {
  const { invoice, status } = row;
  const date = formatDate(invoice.dueDate, "european");

  if (!isOpenStatus(status)) {
    return <span className="tnum text-ink-soft">{date}</span>;
  }

  const days = daysBetween(today, invoice.dueDate);
  const plural = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;
  const relative =
    days < 0 ? `${plural(-days)} overdue` : days === 0 ? "Due today" : `In ${plural(days)}`;

  return (
    <div>
      <p className="tnum">{date}</p>
      <p className={cn("text-micro", days < 0 ? "text-signal" : "text-ink-faint")}>{relative}</p>
    </div>
  );
}

export function InvoicesView() {
  const router = useRouter();
  const invoices = useInvoicesStore((state) => state.invoices);
  const company = useCompanyStore((state) => state.profile);
  const invoicing = useCompanyStore((state) => state.invoicing);
  const [today] = React.useState(todayIso);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

  const rows = React.useMemo<Row[]>(
    () =>
      invoices
        .map((invoice) => {
          const totals = computeTotals(invoice);
          return { invoice, totals, status: displayStatus(invoice, totals.balance, today) };
        })
        .sort(
          (a, b) =>
            b.invoice.issueDate.localeCompare(a.invoice.issueDate) ||
            b.invoice.number.localeCompare(a.invoice.number),
        ),
    [invoices, today],
  );

  const counts = React.useMemo(
    () =>
      Object.fromEntries(
        filters.map((item) => [item.value, rows.filter((row) => item.match(row.status)).length]),
      ) as Record<Filter, number>,
    [rows],
  );

  const needle = query.trim().toLowerCase();
  const matcher = filters.find((item) => item.value === filter)!.match;
  const visible = rows.filter(
    (row) =>
      matcher(row.status) &&
      (!needle ||
        row.invoice.number.toLowerCase().includes(needle) ||
        row.invoice.customer.name.toLowerCase().includes(needle) ||
        row.invoice.customer.email.toLowerCase().includes(needle)),
  );

  const primary = invoicing.currency;
  const open = rows.filter((row) => isOpenStatus(row.status));
  const overdue = rows.filter((row) => row.status === "overdue");
  const paidRecently = rows.filter(
    (row) =>
      row.status === "paid" &&
      daysBetween((row.invoice.paidAt ?? row.invoice.updatedAt).slice(0, 10), today) <= 30,
  );

  const markPaid = (row: Row) => {
    useInvoicesStore.getState().markPaid(row.invoice.id);
    toast(`${row.invoice.number} marked as paid`, {
      tone: "positive",
      description: `${formatMoney(row.totals.balance, row.invoice.currency)} received from ${row.invoice.customer.name}.`,
    });
  };

  const duplicate = (row: Row) => {
    const store = useInvoicesStore.getState();
    const issueDate = todayIso();
    const copy = store.duplicate(row.invoice.id, {
      number: nextInvoiceNumber(store.invoices, invoicing.prefix),
      issueDate,
      dueDate: addDays(
        issueDate,
        Math.max(0, daysBetween(row.invoice.issueDate, row.invoice.dueDate)),
      ),
    });
    if (!copy) return;
    toast(`Duplicated as ${copy.number}`, { description: "Saved as a draft with today's date." });
    router.push(`/invoices/${copy.id}`);
  };

  const remove = async (row: Row) => {
    const confirmed = await requestConfirm({
      title: `Delete ${row.invoice.number}?`,
      description: `The invoice to ${row.invoice.customer.name} disappears from the list. This can't be undone.`,
      confirmLabel: "Delete invoice",
      tone: "danger",
    });
    if (!confirmed) return;
    useInvoicesStore.getState().remove(row.invoice.id);
    toast(`${row.invoice.number} deleted`);
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        eyebrow={company.name}
        title="Invoices"
        description="Everything you have billed, what is still open and what is late."
        actions={
          <Button asChild variant="solid">
            <Link href="/invoices/new">
              <Plus className="h-4 w-4" />
              New invoice
            </Link>
          </Button>
        }
      />

      <section aria-label="Summary" className="grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
        <Kpi
          label="Outstanding"
          amounts={sumByCurrency(open, (row) => row.totals.balance, primary)}
          currency={primary}
          caption={`${open.length} open ${open.length === 1 ? "invoice" : "invoices"}`}
        />
        <Kpi
          label="Overdue"
          amounts={sumByCurrency(overdue, (row) => row.totals.balance, primary)}
          currency={primary}
          caption={overdue.length ? `${overdue.length} past the due date` : "Nothing is late"}
          signal
        />
        <Kpi
          label="Paid, last 30 days"
          amounts={sumByCurrency(paidRecently, (row) => row.totals.total, primary)}
          currency={primary}
          caption={`${paidRecently.length} ${paidRecently.length === 1 ? "invoice" : "invoices"}`}
        />
        <div className="flex flex-col bg-panel p-4 sm:p-5">
          <p className="field-label uppercase tracking-[0.08em]">Drafts</p>
          <p className="tnum mt-2 text-[1.375rem] leading-tight font-semibold tracking-tight sm:text-2xl">
            {counts.draft}
          </p>
          <p className="mt-auto pt-2 text-micro text-ink-faint">Not sent to anyone yet</p>
        </div>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Filter invoices" className="flex overflow-x-auto border border-rule bg-panel">
          {filters.map((item, index) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={cn(
                "flex shrink-0 items-center gap-2 px-3 py-2 text-[0.8125rem] transition-colors",
                index > 0 && "border-l border-rule",
                filter === item.value
                  ? "bg-ink text-panel"
                  : "text-ink-soft hover:bg-panel-sunken hover:text-ink",
              )}
            >
              {item.label}
              <span className={cn("tnum text-micro", filter === item.value ? "text-panel/60" : "text-ink-faint")}>
                {counts[item.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative md:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by number or customer"
            aria-label="Search invoices"
            className="pl-9"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border border-dashed border-rule-strong bg-panel p-8">
          <FileText className="h-6 w-6 text-ink-faint" aria-hidden />
          <div>
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm text-ink-soft">
              Create the first one: pick a customer, add lines and watch the sheet fill in.
            </p>
          </div>
          <Button asChild variant="solid" size="sm">
            <Link href="/invoices/new">
              <Plus className="h-3.5 w-3.5" />
              New invoice
            </Link>
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-dashed border-rule-strong bg-panel p-8 text-sm">
          <p className="font-medium">Nothing matches</p>
          <p className="text-ink-soft">Try another search or filter.</p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Show all invoices
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-rule bg-panel">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule-strong text-left text-micro text-ink-soft">
                <th scope="col" className="px-4 py-2.5 font-medium">Number</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Customer</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Issued</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Due</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Total</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Balance</th>
                <th scope="col" className="w-px px-2 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const meta = statusMeta[row.status];
                return (
                  <tr
                    key={row.invoice.id}
                    onClick={() => router.push(`/invoices/${row.invoice.id}`)}
                    className="group cursor-pointer border-b border-rule last:border-b-0 hover:bg-panel-sunken"
                  >
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <Link
                        href={`/invoices/${row.invoice.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="tnum font-medium underline-offset-2 hover:underline"
                      >
                        {row.invoice.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="max-w-[16rem] truncate">{row.invoice.customer.name}</p>
                      {row.invoice.customer.email ? (
                        <p className="max-w-[16rem] truncate text-micro text-ink-faint">
                          {row.invoice.customer.email}
                        </p>
                      ) : null}
                    </td>
                    <td className="tnum px-4 py-3 align-top whitespace-nowrap text-ink-soft">
                      {formatDate(row.invoice.issueDate, "european")}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <DueCell row={row} today={today} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </td>
                    <td className="tnum px-4 py-3 text-right align-top">
                      {formatMoney(row.totals.total, row.invoice.currency)}
                    </td>
                    <td className="tnum px-4 py-3 text-right align-top font-medium">
                      {row.status === "paid" || row.status === "void"
                        ? "—"
                        : formatMoney(row.totals.balance, row.invoice.currency)}
                    </td>
                    <td className="px-2 py-2 align-top" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        {isOpenStatus(row.status) ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markPaid(row)}
                            aria-label={`Mark ${row.invoice.number} as paid`}
                            title="Mark as paid"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicate(row)}
                          aria-label={`Duplicate ${row.invoice.number}`}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(row)}
                          aria-label={`Delete ${row.invoice.number}`}
                          title="Delete"
                          className="hover:text-signal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
