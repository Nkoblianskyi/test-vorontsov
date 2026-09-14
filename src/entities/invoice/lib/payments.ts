import type { TemplateConfig } from "@/entities/template/@x/invoice";

export type PaymentLine = { method: string; detail: string };

/** "Accept payment methods" in the template becomes a "how to pay" block on the sheet. */
export function paymentLines(
  payments: TemplateConfig["payments"],
  invoiceNumber: string,
): PaymentLine[] {
  const lines: PaymentLine[] = [];
  const slug =
    invoiceNumber
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") || "invoice";

  if (payments.bankTransfer.enabled) {
    lines.push({ method: "Bank transfer", detail: payments.bankTransfer.details.trim() });
  }
  if (payments.card.enabled) {
    lines.push({ method: "Card", detail: `Pay online at pay.invoicestudio.app/${slug}` });
  }
  if (payments.paypal.enabled) {
    lines.push({ method: "PayPal", detail: payments.paypal.email.trim() });
  }
  return lines;
}
