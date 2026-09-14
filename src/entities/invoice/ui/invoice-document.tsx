import type { TemplateConfig } from "@/features/template-customizer/model/schema";
import type { Invoice } from "../model/invoice";
import { documentStyle } from "../lib/document-theme";
import { calculateTotals, formatDate, formatMoney, formatQuantity } from "../lib/totals";

type Props = {
  config: TemplateConfig;
  invoice: Invoice;
};

function LogoMark({ config }: { config: TemplateConfig }) {
  if (!config.logo.show) return null;

  const size = `${config.logo.size * 0.28}mm`;
  const shaped = config.logo.shape !== "bare";

  if (config.logo.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={config.logo.src}
        alt=""
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: config.logo.shape === "circle" ? "50%" : 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        background: shaped ? "var(--doc-brand)" : "transparent",
        color: shaped ? "var(--doc-brand-ink)" : "var(--doc-brand)",
        borderRadius: config.logo.shape === "circle" ? "50%" : 0,
        fontSize: `${config.logo.size * 0.11}mm`,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {config.logo.monogram || "–"}
    </div>
  );
}

function Party({
  caption,
  name,
  lines,
  taxId,
}: {
  caption: string;
  name: string;
  lines: string[];
  taxId?: string;
}) {
  return (
    <div style={{ maxWidth: "62mm" }}>
      <p
        style={{
          color: "var(--doc-ink-soft)",
          fontSize: "0.78em",
          marginBottom: "1.2mm",
        }}
      >
        {caption}
      </p>
      <p style={{ fontWeight: 600, marginBottom: "0.8mm" }}>{name}</p>
      {lines.map((line) => (
        <p key={line} style={{ color: "var(--doc-ink-soft)", lineHeight: 1.45 }}>
          {line}
        </p>
      ))}
      {taxId ? (
        <p style={{ color: "var(--doc-ink-soft)", marginTop: "1mm" }} className="tnum">
          VAT {taxId}
        </p>
      ) : null}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "8mm",
        paddingBottom: "1.2mm",
      }}
    >
      <span style={{ color: "var(--doc-ink-soft)" }}>{label}</span>
      <span className="tnum" style={{ fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

export function InvoiceDocument({ config, invoice }: Props) {
  const { content } = config;
  const totals = calculateTotals(invoice, content);
  const rule = `var(--doc-rule-width) solid var(--doc-rule)`;
  const strongRule = `var(--doc-rule-width) solid var(--doc-rule-strong)`;
  const banner = config.headerLayout === "banner";

  const meta = (
    <div style={{ minWidth: "58mm" }}>
      <MetaRow label="Invoice number" value={invoice.number} />
      <MetaRow
        label="Date of issue"
        value={formatDate(invoice.issuedAt, content.dateFormat)}
      />
      {content.showDueDate ? (
        <MetaRow label="Due date" value={formatDate(invoice.dueAt, content.dateFormat)} />
      ) : null}
      {content.showPurchaseOrder ? (
        <MetaRow label="Purchase order" value={invoice.purchaseOrder} />
      ) : null}
    </div>
  );

  const title = (
    <h1
      style={{
        fontSize: "3.1em",
        lineHeight: 0.94,
        letterSpacing: "-0.035em",
        fontWeight: 600,
        color: banner ? "var(--doc-brand-ink)" : "var(--doc-ink)",
      }}
    >
      {content.documentTitle}
    </h1>
  );

  return (
    <article
      style={{
        ...documentStyle(config),
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
            padding: `calc(var(--doc-pad) * 0.6) var(--doc-pad)`,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "10mm",
          }}
        >
          {title}
          <LogoMark config={config} />
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
        {!banner ? (
          <header
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexDirection: config.headerLayout === "stacked" ? "column" : "row",
              gap: config.headerLayout === "stacked" ? "var(--doc-block)" : "10mm",
            }}
          >
            {config.headerLayout === "stacked" ? (
              <>
                <LogoMark config={config} />
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: "10mm",
                  }}
                >
                  {title}
                  {meta}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--doc-block)",
                  }}
                >
                  {title}
                  {meta}
                </div>
                <LogoMark config={config} />
              </>
            )}
          </header>
        ) : (
          meta
        )}

        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10mm",
            borderTop: rule,
            paddingTop: "var(--doc-row)",
          }}
        >
          <Party
            caption="From"
            name={invoice.seller.name}
            lines={invoice.seller.lines}
            taxId={invoice.seller.taxId}
          />
          <Party
            caption="Billed to"
            name={invoice.buyer.name}
            lines={invoice.buyer.lines}
            taxId={invoice.buyer.taxId}
          />
        </section>

        <section>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: strongRule }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: `0 0 var(--doc-row)`,
                    fontWeight: 500,
                    color: "var(--doc-ink-soft)",
                    fontSize: "0.82em",
                  }}
                >
                  Item
                </th>
                {content.showQuantity ? (
                  <th
                    style={{
                      textAlign: "right",
                      padding: `0 0 var(--doc-row)`,
                      fontWeight: 500,
                      color: "var(--doc-ink-soft)",
                      fontSize: "0.82em",
                      width: "24mm",
                    }}
                  >
                    Qty
                  </th>
                ) : null}
                <th
                  style={{
                    textAlign: "right",
                    padding: `0 0 var(--doc-row)`,
                    fontWeight: 500,
                    color: "var(--doc-ink-soft)",
                    fontSize: "0.82em",
                    width: "26mm",
                  }}
                >
                  Rate
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: `0 0 var(--doc-row)`,
                    fontWeight: 500,
                    color: "var(--doc-ink-soft)",
                    fontSize: "0.82em",
                    width: "30mm",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: rule }}>
                  <td style={{ padding: `var(--doc-row) 0` }}>
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                    {content.showItemDescription ? (
                      <span
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
                  {content.showQuantity ? (
                    <td
                      className="tnum"
                      style={{ padding: `var(--doc-row) 0`, textAlign: "right" }}
                    >
                      {formatQuantity(item.quantity)} {item.unit}
                    </td>
                  ) : null}
                  <td
                    className="tnum"
                    style={{ padding: `var(--doc-row) 0`, textAlign: "right" }}
                  >
                    {formatMoney(item.rate, content.currency)}
                  </td>
                  <td
                    className="tnum"
                    style={{
                      padding: `var(--doc-row) 0`,
                      textAlign: "right",
                      fontWeight: 500,
                    }}
                  >
                    {formatMoney(item.quantity * item.rate, content.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "76mm" }}>
            <MetaRow
              label="Subtotal"
              value={formatMoney(totals.subtotal, content.currency)}
            />
            {content.showDiscount ? (
              <MetaRow
                label={`Discount (${invoice.discountRate}%)`}
                value={`− ${formatMoney(totals.discount, content.currency)}`}
              />
            ) : null}
            {totals.taxed.map((tax) => (
              <MetaRow
                key={tax.label}
                label={`${tax.label} (${tax.rate}%)`}
                value={formatMoney(tax.amount, content.currency)}
              />
            ))}
            <div
              style={{
                borderTop: strongRule,
                marginTop: "var(--doc-row)",
                paddingTop: "var(--doc-row)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8mm" }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span className="tnum" style={{ fontWeight: 600 }}>
                  {formatMoney(totals.total, content.currency)}
                </span>
              </div>
            </div>
            {content.showPaymentMade ? (
              <div style={{ marginTop: "var(--doc-row)" }}>
                <MetaRow
                  label="Payment received"
                  value={`− ${formatMoney(totals.paid, content.currency)}`}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8mm",
                    marginTop: "var(--doc-row)",
                    padding: `calc(var(--doc-row) * 0.9) calc(var(--doc-row) * 1.2)`,
                    background: "var(--doc-brand)",
                    color: "var(--doc-brand-ink)",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Balance due</span>
                  <span className="tnum" style={{ fontWeight: 600 }}>
                    {formatMoney(totals.balance, content.currency)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {content.showTerms || content.showStatement ? (
          <section
            style={{
              marginTop: "auto",
              paddingTop: "var(--doc-block)",
              borderTop: rule,
              display: "grid",
              gridTemplateColumns:
                content.showTerms && content.showStatement ? "1fr 1fr" : "1fr",
              gap: "10mm",
              maxWidth: content.showTerms && content.showStatement ? "none" : "120mm",
            }}
          >
            {content.showTerms ? (
              <div>
                <p style={{ fontWeight: 600, marginBottom: "1.2mm" }}>Terms</p>
                <p style={{ color: "var(--doc-ink-soft)", lineHeight: 1.5 }}>
                  {content.terms}
                </p>
              </div>
            ) : null}
            {content.showStatement ? (
              <div>
                <p style={{ fontWeight: 600, marginBottom: "1.2mm" }}>Note</p>
                <p style={{ color: "var(--doc-ink-soft)", lineHeight: 1.5 }}>
                  {content.statement}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {content.showPageFooter ? (
          <footer
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--doc-ink-soft)",
              fontSize: "0.8em",
              borderTop: rule,
              paddingTop: "var(--doc-row)",
            }}
          >
            <span>
              {content.documentTitle} {invoice.number} from {invoice.seller.name}
            </span>
            <span className="tnum">Page 1 of 1</span>
          </footer>
        ) : null}
      </div>
    </article>
  );
}
