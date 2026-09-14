"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Trash2 } from "lucide-react";

import { isOpenStatus } from "@/entities/invoice/lib/status";
import { InvoiceStatusBadge } from "@/entities/invoice/ui/status-badge";
import { cn } from "@/shared/lib/cn";
import { daysBetween } from "@/shared/lib/dates";
import { formatDate, formatMoney } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import type { InvoiceRow } from "../model/rows";

const plural = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;

function DueCell({ row, today }: { row: InvoiceRow; today: string }) {
  const { invoice, status } = row;
  const date = formatDate(invoice.dueDate, "european");

  if (!isOpenStatus(status)) return <span className="tnum text-ink-soft">{date}</span>;

  const days = daysBetween(today, invoice.dueDate);
  const relative =
    days < 0 ? `${plural(-days)} overdue` : days === 0 ? "Due today" : `In ${plural(days)}`;

  return (
    <div>
      <p className="tnum">{date}</p>
      <p className={cn("text-micro", days < 0 ? "text-signal" : "text-ink-faint")}>
        {relative}
      </p>
    </div>
  );
}

const headers = ["Number", "Customer", "Issued", "Due", "Status"] as const;

export function InvoicesTable({
  rows,
  today,
  onMarkPaid,
  onDuplicate,
  onRemove,
}: {
  rows: InvoiceRow[];
  today: string;
  onMarkPaid: (row: InvoiceRow) => void;
  onDuplicate: (row: InvoiceRow) => void;
  onRemove: (row: InvoiceRow) => void;
}) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto border border-rule bg-panel">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule-strong text-left text-micro text-ink-soft">
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-2.5 font-medium">
                {header}
              </th>
            ))}
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              Total
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              Balance
            </th>
            <th scope="col" className="w-px px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { invoice, totals, status } = row;
            const href = `/invoices/${invoice.id}`;
            return (
              <tr
                key={invoice.id}
                onClick={() => router.push(href)}
                className="group cursor-pointer border-b border-rule last:border-b-0 hover:bg-panel-sunken"
              >
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  {/* A real link: keyboard, middle click and "open in new tab" keep working. */}
                  <Link
                    href={href}
                    onClick={(event) => event.stopPropagation()}
                    className="tnum font-medium underline-offset-2 hover:underline"
                  >
                    {invoice.number}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="max-w-[16rem] truncate">{invoice.customer.name}</p>
                  {invoice.customer.email ? (
                    <p className="max-w-[16rem] truncate text-micro text-ink-faint">
                      {invoice.customer.email}
                    </p>
                  ) : null}
                </td>
                <td className="tnum px-4 py-3 align-top whitespace-nowrap text-ink-soft">
                  {formatDate(invoice.issueDate, "european")}
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <DueCell row={row} today={today} />
                </td>
                <td className="px-4 py-3 align-top">
                  <InvoiceStatusBadge status={status} />
                </td>
                <td className="tnum px-4 py-3 text-right align-top">
                  {formatMoney(totals.total, invoice.currency)}
                </td>
                <td className="tnum px-4 py-3 text-right align-top font-medium">
                  {status === "paid" ? "—" : formatMoney(totals.balance, invoice.currency)}
                </td>
                <td
                  className="px-2 py-2 align-top"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    {isOpenStatus(status) ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMarkPaid(row)}
                        aria-label={`Mark ${invoice.number} as paid`}
                        title="Mark as paid"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDuplicate(row)}
                      aria-label={`Duplicate ${invoice.number}`}
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(row)}
                      aria-label={`Delete ${invoice.number}`}
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
  );
}
