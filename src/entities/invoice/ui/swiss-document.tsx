import type { CSSProperties } from "react";

import type { TemplateConfig } from "@/entities/template/model/schema";
import { LogoMark } from "@/entities/template/ui/logo-mark";
import { formatDate, formatMoney, formatPercent, formatQuantity } from "@/shared/lib/format";
import { swissDocumentStyle } from "../lib/document-theme";
import { paymentLines } from "../lib/payments";
import { computeTotals } from "../lib/totals";
import type { DocumentParty, InvoiceDocumentData } from "../model/document";

type Props = {
  config: TemplateConfig;
  data: InvoiceDocumentData;
};

const headCell: CSSProperties = {
  padding: "0 0 var(--doc-row)",
  fontWeight: 500,
  color: "var(--doc-ink-soft)",
  fontSize: "0.82em",
  textAlign: "right",
};

const bodyCell: CSSProperties = {
  padding: "var(--doc-row) 0",
  textAlign: "right",
  verticalAlign: "top",
};

function Party({
  caption,
  party,
  kind,
}: {
  caption: string;
  party: DocumentParty;
  kind: "seller" | "buyer";
}) {
  const buyer = kind === "buyer";
  return (
    <div style={{ maxWidth: "70mm" }} data-edit={buyer ? undefined : "seller"}>
      {caption ? (
        <p style={{ color: "var(--doc-ink-soft)", fontSize: "0.78em", marginBottom: "1.2mm" }}>
          {caption}
        </p>
      ) : null}
      <p style={{ fontWeight: 600, marginBottom: "0.8mm" }} data-edit={buyer ? "buyer.name" : undefined}>
        {party.name}
      </p>
      {party.lines.length ? (
        <div data-edit={buyer ? "buyer.address" : undefined}>
          {party.lines.map((line, index) => (
            <p key={index} style={{ color: "var(--doc-ink-soft)", lineHeight: 1.45 }}>
              {line}
            </p>
          ))}
        </div>
      ) : null}
      {party.taxId ? (
        <p
          style={{ color: "var(--doc-ink-soft)", marginTop: "1mm" }}
          className="tnum"
          data-edit={buyer ? "buyer.taxId" : undefined}
        >
          Tax ID {party.taxId}
        </p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  edit,
}: {
  label: string;
  value: string;
  strong?: boolean;
  edit?: string;
}) {
  return (
    <div
      data-edit={edit}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "8mm",
        paddingBottom: "1.2mm",
        fontWeight: strong ? 600 : undefined,
      }}
    >
      <span style={{ color: strong ? undefined : "var(--doc-ink-soft)" }}>{label}</span>
      <span className="tnum" style={{ fontWeight: strong ? 600 : 500, whiteSpace: "nowrap" }}>
        {value}
      </span>
    </div>
  );
}

/** Our own layout: Swiss grid, measured in millimetres so the approved layout is the printed one. */
export function SwissDocument({ config, data }: Props) {
  const { fields, dateFormat, documentTitle } = config.content;
  const totals = computeTotals(data);
  const money = (value: number) => formatMoney(value, data.currency);
  const date = (iso: string) => formatDate(iso, dateFormat);
  const rule = "var(--doc-rule-width) solid var(--doc-rule)";
  const strongRule = "var(--doc-rule-width) solid var(--doc-rule-strong)";
  const banner = config.headerLayout === "banner";
  const stacked = config.headerLayout === "stacked";
  const payments = fields.paymentDetails.show ? paymentLines(config.payments, data.number) : [];
  const logoBox = `${config.logo.size * 0.28}mm`;

  const metaRows: [label: string, value: string, edit: string][] = [];
  if (fields.invoiceNumber.show) metaRows.push([fields.invoiceNumber.label, data.number, "meta.number"]);
  if (fields.issueDate.show) metaRows.push([fields.issueDate.label, date(data.issueDate), "meta.issueDate"]);
  if (fields.dueDate.show) metaRows.push([fields.dueDate.label, date(data.dueDate), "meta.dueDate"]);
  if (fields.reference.show && data.reference.trim()) {
    metaRows.push([fields.reference.label, data.reference, "meta.reference"]);
  }

  const meta = metaRows.length ? (
    <div style={{ minWidth: "58mm" }}>
      {metaRows.map(([label, value, edit], index) => (
        <Row key={index} label={label} value={value} edit={edit} />
      ))}
    </div>
  ) : null;

  const title = (
    <h1
      data-edit="title"
      style={{
        fontSize: "3.1em",
        lineHeight: 0.94,
        letterSpacing: "-0.035em",
        fontWeight: 600,
        color: banner ? "var(--doc-brand-ink)" : "var(--doc-ink)",
      }}
    >
      {documentTitle}
    </h1>
  );

  const logo = config.logo.show ? (
    <div data-edit="logo">
      <LogoMark logo={config.logo} color={config.primaryColor} box={logoBox} />
    </div>
  ) : null;

  const hasTerms = fields.terms.show && Boolean(data.terms.trim());
  const hasStatement = fields.statement.show && Boolean(data.statement.trim());

  return (
    <article
      style={{
        ...swissDocumentStyle(config),
        width: "210mm",
        minHeight: "297mm",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {config.accentBand && !banner ? (
        <div style={{ height: "4mm", background: "var(--doc-brand)" }} />
      ) : null}

      {banner ? (
        <header
          style={{
            background: "var(--doc-brand)",
            color: "var(--doc-brand-ink)",
            padding: "calc(var(--doc-pad) * 0.6) var(--doc-pad)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "10mm",
          }}
        >
          {title}
          {logo}
        </header>
      ) : null}

      <div
        style={{
          padding: "var(--doc-pad)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--doc-block)",
          flex: 1,
        }}
      >
        {banner ? (
          meta
        ) : stacked ? (
          <header style={{ display: "flex", flexDirection: "column", gap: "var(--doc-block)" }}>
            {logo}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "10mm",
              }}
            >
              {title}
              {meta}
            </div>
          </header>
        ) : (
          <header
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "10mm",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--doc-block)" }}>
              {title}
              {meta}
            </div>
            {logo}
          </header>
        )}

        {fields.companyAddress.show || fields.billedTo.show ? (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10mm",
              borderTop: rule,
              paddingTop: "var(--doc-row)",
            }}
          >
            {fields.companyAddress.show ? (
              <Party caption={fields.companyAddress.label} party={data.seller} kind="seller" />
            ) : (
              <div />
            )}
            {fields.billedTo.show ? (
              <Party caption={fields.billedTo.label} party={data.buyer} kind="buyer" />
            ) : null}
          </section>
        ) : null}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: strongRule }}>
              <th style={{ ...headCell, textAlign: "left" }} data-edit="labels">
                {fields.itemName.label}
              </th>
              {fields.itemQuantity.show ? (
                <th style={{ ...headCell, width: "24mm" }} data-edit="labels">
                  {fields.itemQuantity.label}
                </th>
              ) : null}
              {fields.itemRate.show ? (
                <th style={{ ...headCell, width: "28mm" }} data-edit="labels">
                  {fields.itemRate.label}
                </th>
              ) : null}
              <th style={{ ...headCell, width: "32mm" }} data-edit="labels">
                {fields.itemTotal.label}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: rule }}>
                <td style={{ padding: "var(--doc-row) 0", verticalAlign: "top" }}>
                  <span style={{ fontWeight: 500, display: "block" }} data-edit={`item.${index}.name`}>
                    {item.name}
                  </span>
                  {fields.itemDescription.show && item.description ? (
                    <span
                      data-edit={`item.${index}.description`}
                      style={{
                        display: "block",
                        color: "var(--doc-ink-soft)",
                        fontSize: "0.88em",
                        maxWidth: "95mm",
                        lineHeight: 1.45,
                      }}
                    >
                      {item.description}
                    </span>
                  ) : null}
                </td>
                {fields.itemQuantity.show ? (
                  <td className="tnum" style={bodyCell} data-edit={`item.${index}.quantity`}>
                    {formatQuantity(item.quantity)}
                  </td>
                ) : null}
                {fields.itemRate.show ? (
                  <td className="tnum" style={bodyCell} data-edit={`item.${index}.rate`}>
                    {money(item.rate)}
                  </td>
                ) : null}
                <td
                  className="tnum"
                  style={{ ...bodyCell, fontWeight: 500 }}
                  data-edit={`item.${index}.rate`}
                >
                  {money(totals.lines[index] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "80mm" }}>
            {fields.subtotal.show ? (
              <Row label={fields.subtotal.label} value={money(totals.subtotal)} edit="subtotal" />
            ) : null}
            {fields.discount.show && totals.discount > 0 ? (
              <Row
                label={
                  data.discount.type === "percent"
                    ? `${fields.discount.label} (${formatPercent(data.discount.value)})`
                    : fields.discount.label
                }
                value={`− ${money(totals.discount)}`}
                edit="discount"
              />
            ) : null}
            {fields.taxes.show
              ? totals.taxes.map((tax, index) => (
                  <Row
                    key={index}
                    label={`${tax.name} (${formatPercent(tax.rate)})`}
                    value={money(tax.amount)}
                    edit={`tax.${index}`}
                  />
                ))
              : null}
            <div
              style={{ borderTop: strongRule, marginTop: "var(--doc-row)", paddingTop: "var(--doc-row)" }}
            >
              <Row label={fields.total.label} value={money(totals.total)} strong edit="total" />
            </div>
            {fields.paymentMade.show && totals.paid > 0 ? (
              <Row label={fields.paymentMade.label} value={`− ${money(totals.paid)}`} edit="paid" />
            ) : null}
            {fields.balanceDue.show ? (
              <div
                data-edit="balance"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8mm",
                  marginTop: "var(--doc-row)",
                  padding: "calc(var(--doc-row) * 0.9) calc(var(--doc-row) * 1.2)",
                  background: "var(--doc-secondary)",
                  color: "var(--doc-secondary-ink)",
                  fontWeight: 600,
                }}
              >
                <span>{fields.balanceDue.label}</span>
                <span className="tnum">{money(totals.balance)}</span>
              </div>
            ) : null}
          </div>
        </section>

        {payments.length ? (
          <section
            data-edit="payment"
            style={{
              borderTop: `2px solid var(--doc-secondary)`,
              paddingTop: "var(--doc-row)",
              display: "grid",
              gridTemplateColumns: "34mm 1fr",
              rowGap: "1.2mm",
            }}
          >
            <p style={{ gridColumn: "1 / -1", fontWeight: 600, color: "var(--doc-secondary)" }}>
              {fields.paymentDetails.label}
            </p>
            {payments.map((line) => (
              <div key={line.method} style={{ display: "contents" }}>
                <span style={{ color: "var(--doc-ink-soft)" }}>{line.method}</span>
                <span>{line.detail}</span>
              </div>
            ))}
          </section>
        ) : null}

        {hasTerms || hasStatement ? (
          <section
            style={{
              marginTop: "auto",
              paddingTop: "var(--doc-block)",
              borderTop: rule,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10mm",
            }}
          >
            {hasTerms ? (
              <div data-edit="terms">
                <p style={{ fontWeight: 600, marginBottom: "1.2mm" }}>{fields.terms.label}</p>
                <p style={{ color: "var(--doc-ink-soft)", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                  {data.terms}
                </p>
              </div>
            ) : (
              <div />
            )}
            {hasStatement ? (
              <div data-edit="statement">
                <p style={{ fontWeight: 600, marginBottom: "1.2mm" }}>{fields.statement.label}</p>
                <p style={{ color: "var(--doc-ink-soft)", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                  {data.statement}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {fields.pageFooter.show ? (
          <footer
            data-edit="footer"
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--doc-ink-soft)",
              fontSize: "0.8em",
              borderTop: rule,
              paddingTop: "var(--doc-row)",
              marginTop: hasTerms || hasStatement ? undefined : "auto",
            }}
          >
            <span>
              {documentTitle} {data.number} · {data.seller.name}
            </span>
            <span className="tnum">Page 1 of 1</span>
          </footer>
        ) : null}
      </div>
    </article>
  );
}
