import type { Path } from "react-hook-form";
import type { InvoiceInput } from "@/entities/invoice/model/schema";
import { itemFieldId } from "./line-item";

export type FieldEdit = {
  kind: "field";
  label: string;
  path: Path<InvoiceInput>;
  input: "text" | "textarea" | "number";
  /** id of the matching control in the form, for "Show in form". */
  fieldId: string;
  suffix?: string;
};

/** What a click on the sheet means in the invoice editor (keys come from `data-edit`). */
export type EditTarget =
  | FieldEdit
  /** Dates open the calendar next to the form field. */
  | { kind: "jump"; fieldId: string; openPicker?: boolean }
  /** Printed by the template: title, logo, labels, payment block. */
  | { kind: "template"; label: string }
  /** Printed from Settings: the seller block. */
  | { kind: "company" };

const field = (
  label: string,
  path: Path<InvoiceInput>,
  fieldId: string,
  input: FieldEdit["input"] = "text",
  suffix?: string,
): FieldEdit => ({ kind: "field", label, path, fieldId, input, suffix });

const ITEM_PARTS = {
  name: { label: "Item", input: "text" },
  description: { label: "Description", input: "textarea" },
  quantity: { label: "Quantity", input: "number" },
  rate: { label: "Rate", input: "number" },
} as const;

const TEMPLATE_PARTS: Record<string, string> = {
  title: "Title",
  logo: "Logo",
  labels: "Column labels",
  payment: "Payment details",
  footer: "Page footer",
};

export function resolveEditTarget(key: string, currency: string): EditTarget | null {
  const item = /^item\.(\d+)\.(name|description|quantity|rate)$/.exec(key);
  if (item) {
    const index = Number(item[1]);
    const part = item[2] as keyof typeof ITEM_PARTS;
    return field(
      `Line ${index + 1} · ${ITEM_PARTS[part].label}`,
      `items.${index}.${part}`,
      itemFieldId(index, part),
      ITEM_PARTS[part].input,
      part === "rate" ? currency : undefined,
    );
  }

  const tax = /^tax\.(\d+)$/.exec(key);
  if (tax) {
    const index = Number(tax[1]);
    return field(
      `Tax ${index + 1} rate`,
      `taxes.${index}.rate`,
      `tax-${index}-rate`,
      "number",
      "%",
    );
  }

  if (key in TEMPLATE_PARTS) return { kind: "template", label: TEMPLATE_PARTS[key] };

  switch (key) {
    case "meta.number":
      return field("Invoice number", "number", "invoice-number");
    case "meta.reference":
      return field("Reference / PO", "reference", "invoice-reference");
    case "meta.issueDate":
      return { kind: "jump", fieldId: "issue-date", openPicker: true };
    case "meta.dueDate":
      return { kind: "jump", fieldId: "due-date", openPicker: true };
    case "buyer.name":
      return field("Customer name", "customer.name", "customer-name");
    case "buyer.address":
      return field("Billing address", "customer.address", "customer-address", "textarea");
    case "buyer.taxId":
      return field("Customer tax ID", "customer.taxId", "customer-tax");
    case "discount":
      return field("Discount", "discount.value", "discount-value", "number");
    case "paid":
    case "balance":
      return field("Already paid", "amountPaid", "amount-paid", "number", currency);
    case "subtotal":
    case "total":
      return { kind: "jump", fieldId: "summary" };
    case "terms":
      return field("Terms & conditions", "terms", "terms", "textarea");
    case "statement":
      return field("Statement", "statement", "statement", "textarea");
    case "seller":
      return { kind: "company" };
    default:
      return null;
  }
}
