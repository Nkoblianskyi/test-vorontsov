import { z } from "zod";
import { currencyValues } from "@/shared/lib/format";
import { computeTotals } from "../lib/totals";

export const invoiceStatusValues = ["draft", "sent", "paid", "void"] as const;
export type InvoiceStatus = (typeof invoiceStatusValues)[number];

export const discountTypeValues = ["percent", "amount"] as const;
export type DiscountType = (typeof discountTypeValues)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

const amount = (label: string) =>
  z.number({ invalid_type_error: `Enter ${label}`, required_error: `Enter ${label}` });

export const lineItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name the item").max(80),
  description: z.string().max(300, "Keep it under 300 characters"),
  quantity: amount("a quantity").positive("Must be above 0").max(1_000_000),
  rate: amount("a rate").min(0, "Can't be negative").max(1_000_000_000),
});

export const taxLineSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name the tax").max(40),
  rate: amount("a rate").min(0, "Can't be negative").max(100, "100% at most"),
});

export const invoiceSchema = z
  .object({
    number: z.string().trim().min(1, "Invoice number is required").max(32),
    status: z.enum(invoiceStatusValues),
    templateId: z.string().min(1, "Pick a template"),
    currency: z.enum(currencyValues),
    issueDate: isoDate,
    dueDate: isoDate,
    reference: z.string().max(40),
    customer: z.object({
      name: z.string().trim().min(1, "Who is this invoice for?").max(80),
      email: z.union([z.literal(""), z.string().trim().email("That email looks incomplete")]),
      address: z.string().max(300),
      taxId: z.string().max(40),
    }),
    items: z.array(lineItemSchema).min(1, "Add at least one line item"),
    discount: z.object({
      type: z.enum(discountTypeValues),
      value: amount("a discount").min(0, "Can't be negative"),
    }),
    taxes: z.array(taxLineSchema).max(5),
    amountPaid: amount("an amount").min(0, "Can't be negative"),
    terms: z.string().max(600, "Keep it under 600 characters"),
    statement: z.string().max(600, "Keep it under 600 characters"),
  })
  .superRefine((value, ctx) => {
    if (value.dueDate < value.issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Due date can't be before the issue date",
      });
    }
    if (value.discount.type === "percent" && value.discount.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount", "value"],
        message: "A percentage discount tops out at 100%",
      });
    }
    const { total } = computeTotals(value);
    if (value.amountPaid > total + 0.005) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amountPaid"],
        message: "More than the invoice total",
      });
    }
  });

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type TaxLine = z.infer<typeof taxLineSchema>;

export type InvoiceRecord = InvoiceInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  paidAt: string | null;
};

export function toInvoiceInput(record: InvoiceRecord): InvoiceInput {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    sentAt: _sentAt,
    paidAt: _paidAt,
    ...input
  } = record;
  return input;
}
