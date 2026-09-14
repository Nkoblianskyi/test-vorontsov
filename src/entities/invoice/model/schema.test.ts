import { describe, expect, it } from "vitest";
import { seedInvoices } from "./samples";
import { invoiceSchema, isInvoiceRecord, type InvoiceInput } from "./schema";

const valid: InvoiceInput = {
  number: "INV-0001",
  status: "draft",
  templateId: "standard",
  currency: "USD",
  issueDate: "2026-09-14",
  dueDate: "2026-09-28",
  reference: "",
  customer: { name: "Copperleaf Studio", email: "", address: "", taxId: "" },
  items: [{ id: "a", name: "Design", description: "", quantity: 1, rate: 100 }],
  discount: { type: "percent", value: 0 },
  taxes: [],
  amountPaid: 0,
  terms: "",
  statement: "",
};

const issuesFor = (input: InvoiceInput) => {
  const result = invoiceSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

describe("invoiceSchema", () => {
  it("accepts a complete invoice", () => {
    expect(issuesFor(valid)).toEqual([]);
  });

  it("rejects a due date before the issue date", () => {
    expect(issuesFor({ ...valid, dueDate: "2026-09-01" })).toEqual(["dueDate"]);
  });

  it("caps percentage discounts at 100", () => {
    expect(issuesFor({ ...valid, discount: { type: "percent", value: 101 } })).toEqual([
      "discount.value",
    ]);
    expect(issuesFor({ ...valid, discount: { type: "amount", value: 99 } })).toEqual([]);
  });

  it("does not allow a fixed discount larger than the subtotal", () => {
    expect(issuesFor({ ...valid, discount: { type: "amount", value: 101 } })).toEqual([
      "discount.value",
    ]);
  });

  it("does not allow paying more than the total", () => {
    expect(issuesFor({ ...valid, amountPaid: 100.01 })).toEqual(["amountPaid"]);
    expect(issuesFor({ ...valid, amountPaid: 100 })).toEqual([]);
  });

  it("needs a customer, a line and a positive quantity", () => {
    expect(issuesFor({ ...valid, customer: { ...valid.customer, name: "  " } })).toEqual([
      "customer.name",
    ]);
    expect(issuesFor({ ...valid, items: [] })).toEqual(["items"]);
    expect(issuesFor({ ...valid, items: [{ ...valid.items[0], quantity: 0 }] })).toEqual([
      "items.0.quantity",
    ]);
  });

  it("reports an empty number field instead of accepting NaN", () => {
    expect(
      issuesFor({ ...valid, items: [{ ...valid.items[0], rate: Number.NaN }] }),
    ).toEqual(["items.0.rate"]);
  });

  it("validates every demo invoice as a stored record", () => {
    for (const invoice of seedInvoices("2026-09-14")) {
      expect(isInvoiceRecord(invoice), invoice.number).toBe(true);
    }
  });

  it("rejects stored records that lost their metadata or shape", () => {
    const [invoice] = seedInvoices("2026-09-14");
    expect(isInvoiceRecord({ ...invoice, id: undefined })).toBe(false);
    expect(isInvoiceRecord({ ...invoice, items: "broken" })).toBe(false);
    expect(isInvoiceRecord(null)).toBe(false);
  });
});
