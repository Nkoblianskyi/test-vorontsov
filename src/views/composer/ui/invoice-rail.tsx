"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";

import { displayStatus } from "@/entities/invoice/lib/status";
import { computeTotals } from "@/entities/invoice/lib/totals";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import { InvoiceStatusBadge } from "@/entities/invoice/ui/status-badge";
import { cn } from "@/shared/lib/cn";
import { todayIso } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

/** Every invoice one click away, without leaving the composer. */
export function InvoiceRail({
  currentId,
  onOpen,
  onNew,
  className,
}: {
  currentId: string | undefined;
  onOpen: (id: string) => void;
  onNew: () => void;
  className?: string;
}) {
  const invoices = useInvoicesStore((state) => state.invoices);
  const [query, setQuery] = React.useState("");
  const [today] = React.useState(todayIso);

  const rows = React.useMemo(
    () =>
      [...invoices]
        .sort(
          (a, b) =>
            b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number),
        )
        .map((invoice) => {
          const totals = computeTotals(invoice);
          return { invoice, totals, status: displayStatus(invoice, totals.balance, today) };
        }),
    [invoices, today],
  );

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? rows.filter(({ invoice }) =>
        `${invoice.number} ${invoice.customer.name}`.toLowerCase().includes(needle),
      )
    : rows;

  return (
    <aside
      data-print="hide"
      aria-label="Invoices"
      className={cn(
        "w-[272px] shrink-0 flex-col border-r border-rule-strong bg-panel",
        className,
      )}
    >
      <div className="space-y-2 border-b border-rule p-3">
        <Button variant="solid" className="w-full" onClick={onNew}>
          <Plus className="h-4 w-4" />
          New invoice
        </Button>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter invoices"
            aria-label="Filter invoices"
            className="h-9 pl-8 text-[0.8125rem]"
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {visible.map(({ invoice, totals, status }) => {
          const active = invoice.id === currentId;
          return (
            <li key={invoice.id}>
              <button
                type="button"
                onClick={() => onOpen(invoice.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex w-full flex-col gap-1 border-b border-rule px-3 py-2.5 text-left transition-colors",
                  active ? "bg-panel-sunken" : "hover:bg-panel-sunken",
                )}
              >
                {active ? (
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-ink" aria-hidden />
                ) : null}
                <span className="flex items-center justify-between gap-2">
                  <span className="tnum text-[0.8125rem] font-semibold">
                    {invoice.number}
                  </span>
                  <InvoiceStatusBadge status={status} />
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-micro text-ink-soft">
                    {invoice.customer.name}
                  </span>
                  <span className="tnum shrink-0 text-micro font-medium">
                    {formatMoney(
                      status === "paid" ? totals.total : totals.balance,
                      invoice.currency,
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {visible.length === 0 ? (
          <li className="px-3 py-6 text-micro text-ink-faint">No invoice matches.</li>
        ) : null}
      </ul>
    </aside>
  );
}
