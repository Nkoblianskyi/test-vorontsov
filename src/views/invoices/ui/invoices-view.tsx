"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Search } from "lucide-react";

import { useCompanyStore } from "@/entities/company/model/store";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import { todayIso } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/cn";
import { formatMoney } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { requestConfirm } from "@/shared/ui/confirm";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { toast } from "@/shared/ui/toast";
import {
  buildRows,
  invoiceFilters,
  matchesQuery,
  type InvoiceFilter,
  type InvoiceRow,
} from "../model/rows";
import { InvoicesTable } from "./invoices-table";
import { KpiStrip } from "./kpi-strip";

function EmptyState({ onReset }: { onReset?: () => void }) {
  if (onReset) {
    return (
      <div className="border border-dashed border-rule-strong bg-panel p-8 text-sm">
        <p className="font-medium">Nothing matches</p>
        <p className="text-ink-soft">Try another search or filter.</p>
        <Button size="sm" className="mt-3" onClick={onReset}>
          Show all invoices
        </Button>
      </div>
    );
  }

  return (
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
  );
}

export function InvoicesView() {
  const router = useRouter();
  const invoices = useInvoicesStore((state) => state.invoices);
  const company = useCompanyStore((state) => state.profile);
  const invoicing = useCompanyStore((state) => state.invoicing);
  const [today] = React.useState(todayIso);
  const [filter, setFilter] = React.useState<InvoiceFilter>("all");
  const [query, setQuery] = React.useState("");

  const rows = React.useMemo(() => buildRows(invoices, today), [invoices, today]);
  const counts = React.useMemo(
    () =>
      Object.fromEntries(
        invoiceFilters.map((item) => [
          item.value,
          rows.filter((row) => item.match(row.status)).length,
        ]),
      ) as Record<InvoiceFilter, number>,
    [rows],
  );

  const match = invoiceFilters.find((item) => item.value === filter)?.match ?? (() => true);
  const visible = rows.filter((row) => match(row.status) && matchesQuery(row, query));

  const markPaid = (row: InvoiceRow) => {
    useInvoicesStore.getState().markPaid(row.invoice.id);
    toast(`${row.invoice.number} marked as paid`, {
      tone: "positive",
      description: `${formatMoney(row.totals.balance, row.invoice.currency)} received from ${row.invoice.customer.name}.`,
    });
  };

  const duplicate = (row: InvoiceRow) => {
    const copy = useInvoicesStore.getState().duplicate(row.invoice.id, invoicing.prefix);
    if (!copy) return;
    toast(`Duplicated as ${copy.number}`, {
      description: "Saved as a draft with today's date.",
    });
    router.push(`/invoices/${copy.id}`);
  };

  const remove = async (row: InvoiceRow) => {
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

      <KpiStrip rows={rows} today={today} currency={invoicing.currency} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="group"
          aria-label="Filter invoices"
          className="flex overflow-x-auto border border-rule bg-panel"
        >
          {invoiceFilters.map((item, index) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.value)}
                className={cn(
                  "flex shrink-0 items-center gap-2 px-3 py-2 text-[0.8125rem] transition-colors",
                  index > 0 && "border-l border-rule",
                  active
                    ? "bg-ink text-panel"
                    : "text-ink-soft hover:bg-panel-sunken hover:text-ink",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "tnum text-micro",
                    active ? "text-panel/60" : "text-ink-faint",
                  )}
                >
                  {counts[item.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative md:w-80">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-faint"
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
        <EmptyState />
      ) : visible.length === 0 ? (
        <EmptyState
          onReset={() => {
            setQuery("");
            setFilter("all");
          }}
        />
      ) : (
        <InvoicesTable
          rows={visible}
          today={today}
          onMarkPaid={markPaid}
          onDuplicate={duplicate}
          onRemove={remove}
        />
      )}
    </div>
  );
}
