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

function relativeDue(
  row: InvoiceRow,
  today: string,
): { text: string; late: boolean } | null {
  if (!isOpenStatus(row.status)) return null;
  const days = daysBetween(today, row.invoice.dueDate);
  if (days < 0) return { text: `${plural(-days)} overdue`, late: true };
  return { text: days === 0 ? "Due today" : `Due in ${plural(days)}`, late: false };
}

function DueCell({ row, today }: { row: InvoiceRow; today: string }) {
  const date = formatDate(row.invoice.dueDate, "european");
  const relative = relativeDue(row, today);

  if (!relative) return <span className="tnum text-ink-soft">{date}</span>;

  return (
    <div>
      <p className="tnum">{date}</p>
      <p className={cn("text-micro", relative.late ? "text-signal" : "text-ink-faint")}>
        {relative.text}
      </p>
    </div>
  );
}

type Actions = {
  onMarkPaid: (row: InvoiceRow) => void;
  onDuplicate: (row: InvoiceRow) => void;
  onRemove: (row: InvoiceRow) => void;
};

function RowActions({
  row,
  onMarkPaid,
  onDuplicate,
  onRemove,
}: Actions & { row: InvoiceRow }) {
  const { number } = row.invoice;
  return (
    <>
      {isOpenStatus(row.status) ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMarkPaid(row)}
          aria-label={`Mark ${number} as paid`}
          title="Mark as paid"
        >
          <Check className="h-4 w-4" />
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDuplicate(row)}
        aria-label={`Duplicate ${number}`}
        title="Duplicate"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(row)}
        aria-label={`Delete ${number}`}
        title="Delete"
        className="hover:text-signal"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
}

/** Phones: one card per invoice, everything readable without scrolling sideways. */
function InvoiceCards({
  rows,
  today,
  ...actions
}: Actions & { rows: InvoiceRow[]; today: string }) {
  return (
    <ul className="divide-y divide-rule border border-rule bg-panel md:hidden">
      {rows.map((row) => {
        const { invoice, totals, status } = row;
        const relative = relativeDue(row, today);
        const paid = status === "paid";
        return (
          <li key={invoice.id} className="relative px-4 pt-3.5 pb-2 active:bg-panel-sunken">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* Stretched link: the whole card opens the invoice; actions sit above it. */}
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="tnum text-sm font-semibold after:absolute after:inset-0"
                >
                  {invoice.number}
                </Link>
                <p className="truncate text-sm">{invoice.customer.name}</p>
              </div>
              <InvoiceStatusBadge status={status} />
            </div>

            <div className="mt-2 flex items-end justify-between gap-3">
              <p
                className={cn(
                  "tnum text-micro",
                  relative?.late ? "text-signal" : "text-ink-faint",
                )}
              >
                {relative
                  ? relative.text
                  : `Due ${formatDate(invoice.dueDate, "european")}`}
              </p>
              <div className="text-right">
                <p className="tnum text-base font-semibold tracking-tight">
                  {formatMoney(paid ? totals.total : totals.balance, invoice.currency)}
                </p>
                <p className="text-micro text-ink-faint">
                  {paid
                    ? "Paid in full"
                    : `Balance of ${formatMoney(totals.total, invoice.currency)}`}
                </p>
              </div>
            </div>

            <div className="relative z-10 -mr-2 mt-1 flex justify-end">
              <RowActions row={row} {...actions} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const headers = ["Number", "Customer", "Issued", "Due", "Status"] as const;

/** Tablets and up: the full table. */
function InvoiceTable({
  rows,
  today,
  ...actions
}: Actions & { rows: InvoiceRow[]; today: string }) {
  const router = useRouter();

  return (
    <div className="hidden overflow-x-auto border border-rule bg-panel md:block">
      <table className="w-full min-w-[760px] border-collapse text-sm">
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
                <td className="tnum px-4 py-3 text-right align-top whitespace-nowrap">
                  {formatMoney(totals.total, invoice.currency)}
                </td>
                <td className="tnum px-4 py-3 text-right align-top font-medium whitespace-nowrap">
                  {status === "paid" ? "—" : formatMoney(totals.balance, invoice.currency)}
                </td>
                <td
                  className="px-2 py-2 align-top"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <RowActions row={row} {...actions} />
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

/** Mobile first: cards on phones, a table from tablet width up. */
export function InvoicesTable(props: Actions & { rows: InvoiceRow[]; today: string }) {
  return (
    <>
      <InvoiceCards {...props} />
      <InvoiceTable {...props} />
    </>
  );
}
