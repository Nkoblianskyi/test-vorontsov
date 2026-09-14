import type { Invoice } from "../model/invoice";
import type { TemplateConfig } from "@/features/template-customizer/model/schema";

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  taxed: { label: string; rate: number; amount: number }[];
  total: number;
  paid: number;
  balance: number;
};

export function calculateTotals(
  invoice: Invoice,
  content: TemplateConfig["content"],
): InvoiceTotals {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const discount = content.showDiscount ? (subtotal * invoice.discountRate) / 100 : 0;
  const net = subtotal - discount;

  const taxed = content.showTaxes
    ? invoice.taxes.map((tax) => ({
        label: tax.label,
        rate: tax.rate,
        amount: (net * tax.rate) / 100,
      }))
    : [];

  const total = net + taxed.reduce((sum, tax) => sum + tax.amount, 0);
  const paid = content.showPaymentMade ? invoice.amountPaid : 0;

  return { subtotal, discount, taxed, total, paid, balance: total - paid };
}

const currencyLocale: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  PLN: "pl-PL",
  UAH: "uk-UA",
};

export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat(currencyLocale[currency] ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export function formatDate(
  iso: string,
  format: TemplateConfig["content"]["dateFormat"],
): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (format === "iso") return iso;
  if (format === "numeric") {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" }).format(date);
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
