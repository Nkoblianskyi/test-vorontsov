import type { CSSProperties } from "react";

import type { TemplateConfig } from "@/entities/template/model/schema";
import { LogoMark } from "@/entities/template/ui/logo-mark";
import { mix } from "@/shared/lib/color";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatMoney, formatPercent, formatQuantity } from "@/shared/lib/format";
import { computeTotals } from "../lib/totals";
import { paymentLines } from "../lib/payments";
import type { DocumentParty, InvoiceDocumentData } from "../model/document";
import { documentFonts } from "./document-fonts";
import styles from "./classic-document.module.css";

type Props = {
  config: TemplateConfig;
  data: InvoiceDocumentData;
  /** Fluid: fills its container like the reference preview card. Otherwise an A4 sheet. */
  fluid?: boolean;
};

/**
 * `data-edit` marks what each piece of the sheet is. It does nothing on its own;
 * editors that want click-to-edit read it (see PreviewStage `onPick`).
 */
function Party({
  caption,
  party,
  upper,
  kind,
}: {
  caption: string;
  party: DocumentParty;
  upper?: boolean;
  kind: "seller" | "buyer";
}) {
  const buyer = kind === "buyer";
  return (
    <div className={styles.party} data-edit={buyer ? undefined : "seller"}>
      {caption ? <p className={styles.strong}>{caption}</p> : null}
      <p
        className={cn(!caption && styles.strong, upper && styles.upper)}
        data-edit={buyer ? "buyer.name" : undefined}
      >
        {party.name}
      </p>
      {party.lines.length ? (
        <div data-edit={buyer ? "buyer.address" : undefined}>
          {party.lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      ) : null}
      {party.taxId ? <p data-edit={buyer ? "buyer.taxId" : undefined}>Tax ID {party.taxId}</p> : null}
    </div>
  );
}

function TotalsRow({
  label,
  value,
  strong,
  edit,
}: {
  label: string;
  value: string;
  strong?: boolean;
  edit: string;
}) {
  return (
    <div className={cn(styles.totalsRow, strong && styles.totalsStrong)} data-edit={edit}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function ClassicDocument({ config, data, fluid = false }: Props) {
  const { fields, dateFormat } = config.content;
  const totals = computeTotals(data);
  const money = (value: number) => formatMoney(value, data.currency);
  const plain = (value: number) => formatMoney(value, data.currency, { symbol: false });
  const date = (iso: string) => formatDate(iso, dateFormat);
  const payments = fields.paymentDetails.show ? paymentLines(config.payments, data.number) : [];

  const meta: [label: string, value: string, edit: string][] = [];
  if (fields.invoiceNumber.show) meta.push([fields.invoiceNumber.label, data.number, "meta.number"]);
  if (fields.issueDate.show) meta.push([fields.issueDate.label, date(data.issueDate), "meta.issueDate"]);
  if (fields.dueDate.show) meta.push([fields.dueDate.label, date(data.dueDate), "meta.dueDate"]);
  if (fields.reference.show && data.reference.trim()) {
    meta.push([fields.reference.label, data.reference, "meta.reference"]);
  }

  const showDescription = fields.itemDescription.show;
  const showQuantity = fields.itemQuantity.show;
  const showRate = fields.itemRate.show;

  const discountLabel =
    data.discount.type === "percent" && data.discount.value > 0
      ? `${fields.discount.label} (${formatPercent(data.discount.value)})`
      : fields.discount.label;

  const style = {
    "--c-primary": config.primaryColor,
    "--c-secondary": config.secondaryColor,
    "--c-ink": config.inkColor,
    "--c-paper": config.paperTint,
    "--c-title": mix(config.inkColor, config.paperTint, 0.15),
    "--c-muted": mix(config.inkColor, config.paperTint, 0.38),
    "--c-rule": mix(config.inkColor, config.paperTint, 0.9),
    fontFamily: documentFonts[config.typeface],
    fontSize: `${(11 * config.typeScale) / 100}px`,
  } as CSSProperties;

  return (
    <article className={cn(styles.paper, !fluid && styles.sheet)} style={style}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} data-edit="title">
            {config.content.documentTitle}
          </h1>
          {meta.length ? (
            <dl className={styles.meta}>
              {meta.map(([label, value, edit], index) => (
                <div key={index} className={styles.metaRow} data-edit={edit}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        {config.logo.show ? (
          <div data-edit="logo">
            <LogoMark
              logo={config.logo}
              color={config.primaryColor}
              box={`${Math.round(config.logo.size * 1.64)}px`}
            />
          </div>
        ) : null}
      </header>

      {fields.companyAddress.show || fields.billedTo.show ? (
        <section className={styles.parties}>
          {fields.companyAddress.show ? (
            <Party caption={fields.companyAddress.label} party={data.seller} upper kind="seller" />
          ) : (
            <div />
          )}
          {fields.billedTo.show ? (
            <Party caption={fields.billedTo.label} party={data.buyer} kind="buyer" />
          ) : null}
        </section>
      ) : null}

      <table className={styles.items}>
        <thead>
          <tr>
            <th className={showDescription ? styles.colItem : undefined} data-edit="labels">
              {fields.itemName.label}
            </th>
            {showDescription ? <th data-edit="labels">{fields.itemDescription.label}</th> : null}
            {showQuantity ? (
              <th className={cn(styles.num, styles.colQty)} data-edit="labels">
                {fields.itemQuantity.label}
              </th>
            ) : null}
            {showRate ? (
              <th className={cn(styles.num, styles.colRate)} data-edit="labels">
                {fields.itemRate.label}
              </th>
            ) : null}
            <th className={cn(styles.num, styles.colTotal)} data-edit="labels">
              {fields.itemTotal.label}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={item.id}>
              <td data-edit={`item.${index}.name`}>{item.name}</td>
              {showDescription ? (
                <td data-edit={`item.${index}.description`}>{item.description}</td>
              ) : null}
              {showQuantity ? (
                <td className={styles.num} data-edit={`item.${index}.quantity`}>
                  {formatQuantity(item.quantity)}
                </td>
              ) : null}
              {showRate ? (
                <td className={styles.num} data-edit={`item.${index}.rate`}>
                  {plain(item.rate)}
                </td>
              ) : null}
              <td className={styles.num} data-edit={`item.${index}.rate`}>
                {money(totals.lines[index] ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.totals}>
        {fields.subtotal.show ? (
          <TotalsRow label={fields.subtotal.label} value={plain(totals.subtotal)} edit="subtotal" />
        ) : null}
        {fields.discount.show ? (
          <TotalsRow
            label={discountLabel}
            value={totals.discount > 0 ? `−${plain(totals.discount)}` : plain(0)}
            edit="discount"
          />
        ) : null}
        {fields.taxes.show
          ? totals.taxes.map((tax, index) => (
              <TotalsRow
                key={index}
                label={`${tax.name} (${formatPercent(tax.rate)})`}
                value={plain(tax.amount)}
                edit={`tax.${index}`}
              />
            ))
          : null}
        <TotalsRow label={fields.total.label} value={money(totals.total)} strong edit="total" />
        {fields.paymentMade.show ? (
          <TotalsRow label={fields.paymentMade.label} value={plain(totals.paid)} edit="paid" />
        ) : null}
        {fields.balanceDue.show ? (
          <TotalsRow label={fields.balanceDue.label} value={money(totals.balance)} strong edit="balance" />
        ) : null}
      </div>

      {payments.length ? (
        <section className={styles.payment} data-edit="payment">
          <p className={styles.paymentTitle}>{fields.paymentDetails.label}</p>
          {payments.map((line) => (
            <p key={line.method} className={styles.paymentRow}>
              <span>{line.method}</span>
              <span>{line.detail}</span>
            </p>
          ))}
        </section>
      ) : null}

      {fields.terms.show && data.terms.trim() ? (
        <section className={styles.block} data-edit="terms">
          <p className={styles.caption}>{fields.terms.label}</p>
          <p>{data.terms}</p>
        </section>
      ) : null}

      {fields.statement.show && data.statement.trim() ? (
        <section className={styles.block} data-edit="statement">
          <p className={styles.caption}>{fields.statement.label}</p>
          <p>{data.statement}</p>
        </section>
      ) : null}

      {fields.pageFooter.show ? (
        <footer className={styles.footer} data-edit="footer">
          <span>
            {config.content.documentTitle} {data.number} · {data.seller.name}
          </span>
          <span>Page 1 of 1</span>
        </footer>
      ) : null}
    </article>
  );
}
