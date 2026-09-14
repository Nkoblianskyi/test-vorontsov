import { isOpenStatus } from "@/entities/invoice/lib/status";
import { cn } from "@/shared/lib/cn";
import { daysBetween, toIsoDate } from "@/shared/lib/dates";
import { formatMoney, type Currency } from "@/shared/lib/format";
import { sumByCurrency, type Amount, type InvoiceRow } from "../model/rows";

const PAID_WINDOW_DAYS = 30;

function Cell({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col bg-panel p-4 sm:p-5">
      <p className="field-label tracking-[0.08em] uppercase">{label}</p>
      {children}
      <p className="mt-auto pt-2 text-micro text-ink-faint">{caption}</p>
    </div>
  );
}

function Money({
  amounts,
  currency,
  signal,
}: {
  amounts: Amount[];
  currency: Currency;
  signal?: boolean;
}) {
  const [first, ...rest] = amounts.length ? amounts : [{ currency, amount: 0 }];
  return (
    <>
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
    </>
  );
}

const plural = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`;

/** The four numbers an accountant opens the list for. */
export function KpiStrip({
  rows,
  today,
  currency,
}: {
  rows: InvoiceRow[];
  today: string;
  currency: Currency;
}) {
  const open = rows.filter((row) => isOpenStatus(row.status));
  const overdue = rows.filter((row) => row.status === "overdue");
  const drafts = rows.filter((row) => row.status === "draft");
  const paidRecently = rows.filter(
    (row) =>
      row.status === "paid" &&
      // Timestamps are UTC; compare the local calendar day, like `today`.
      daysBetween(
        toIsoDate(new Date(row.invoice.paidAt ?? row.invoice.updatedAt)),
        today,
      ) <= PAID_WINDOW_DAYS,
  );

  return (
    <section
      aria-label="Summary"
      className="grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4"
    >
      <Cell label="Outstanding" caption={`${plural(open.length, "open invoice")}`}>
        <Money
          amounts={sumByCurrency(open, (row) => row.totals.balance, currency)}
          currency={currency}
        />
      </Cell>
      <Cell
        label="Overdue"
        caption={overdue.length ? `${overdue.length} past the due date` : "Nothing is late"}
      >
        <Money
          amounts={sumByCurrency(overdue, (row) => row.totals.balance, currency)}
          currency={currency}
          signal
        />
      </Cell>
      <Cell
        label={`Paid, last ${PAID_WINDOW_DAYS} days`}
        caption={plural(paidRecently.length, "invoice")}
      >
        <Money
          amounts={sumByCurrency(paidRecently, (row) => row.totals.total, currency)}
          currency={currency}
        />
      </Cell>
      <Cell label="Drafts" caption="Not sent to anyone yet">
        <p className="tnum mt-2 text-[1.375rem] leading-tight font-semibold tracking-tight sm:text-2xl">
          {drafts.length}
        </p>
      </Cell>
    </section>
  );
}
