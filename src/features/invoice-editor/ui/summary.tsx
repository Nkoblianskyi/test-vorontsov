import type { InvoiceTotals } from "@/entities/invoice/lib/totals";
import type { InvoiceInput } from "@/entities/invoice/model/schema";
import { cn } from "@/shared/lib/cn";
import { formatMoney, formatPercent, type Currency } from "@/shared/lib/format";

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={cn("flex justify-between gap-4 py-1", strong && "font-semibold")}>
      <span className={strong ? undefined : "text-ink-soft"}>{label}</span>
      <span className="tnum">{value}</span>
    </div>
  );
}

/** The totals block of the form: the same numbers the sheet prints. */
export function Summary({
  totals,
  currency,
  discount,
}: {
  totals: InvoiceTotals;
  currency: Currency;
  discount: InvoiceInput["discount"];
}) {
  const money = (value: number) => formatMoney(value, currency);

  return (
    <div id="summary" className="border border-ink text-sm">
      <div className="px-4 py-3">
        <SummaryRow label="Subtotal" value={money(totals.subtotal)} />
        {totals.discount > 0 ? (
          <SummaryRow
            label={
              discount?.type === "percent"
                ? `Discount (${formatPercent(discount.value)})`
                : "Discount"
            }
            value={`− ${money(totals.discount)}`}
          />
        ) : null}
        {totals.taxes.map((tax, index) => (
          <SummaryRow
            key={index}
            label={`${tax.name || "Tax"} (${formatPercent(tax.rate)})`}
            value={money(tax.amount)}
          />
        ))}
        <div className="mt-1 border-t border-rule pt-1">
          <SummaryRow label="Total" value={money(totals.total)} strong />
        </div>
        {totals.paid > 0 ? (
          <SummaryRow label="Paid" value={`− ${money(totals.paid)}`} />
        ) : null}
      </div>
      <div className="flex items-baseline justify-between gap-4 bg-ink px-4 py-3 text-panel">
        <span className="text-micro tracking-[0.08em] text-panel/70 uppercase">
          Balance due
        </span>
        <span className="tnum text-xl font-semibold tracking-tight">
          {money(totals.balance)}
        </span>
      </div>
    </div>
  );
}
