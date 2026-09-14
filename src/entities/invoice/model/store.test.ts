import { describe, expect, it } from "vitest";
import { seedInvoices } from "./samples";
import { isNumberTaken, nextInvoiceNumber } from "./store";

const invoices = seedInvoices("2026-09-14");

describe("nextInvoiceNumber", () => {
  it("continues after the highest number with the same prefix", () => {
    expect(nextInvoiceNumber(invoices, "INV-")).toBe("INV-0007");
  });

  it("starts a new sequence for a new prefix", () => {
    expect(nextInvoiceNumber(invoices, "EST-")).toBe("EST-0001");
  });

  it("ignores numbers that only start with the prefix", () => {
    const withYear = [{ ...invoices[0], number: "INV-2026-0042" }];
    expect(nextInvoiceNumber(withYear, "INV-")).toBe("INV-0001");
  });

  it("treats prefix characters literally", () => {
    const dotted = [
      { ...invoices[0], number: "A.B-0009" },
      { ...invoices[0], number: "AxB-0100" },
    ];
    expect(nextInvoiceNumber(dotted, "A.B-")).toBe("A.B-0010");
  });
});

describe("isNumberTaken", () => {
  it("ignores case and surrounding spaces", () => {
    expect(isNumberTaken(invoices, " inv-0003 ")).toBe(true);
    expect(isNumberTaken(invoices, "INV-0100")).toBe(false);
  });

  it("does not count the invoice being edited", () => {
    const own = invoices.find((invoice) => invoice.number === "INV-0003")!;
    expect(isNumberTaken(invoices, "INV-0003", own.id)).toBe(false);
  });
});
