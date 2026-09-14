import { describe, expect, it } from "vitest";
import {
  dateFormatOptions,
  formatDate,
  formatMoney,
  formatPercent,
  formatQuantity,
} from "./format";

describe("formatMoney", () => {
  it("prints currency with two decimals", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50");
    expect(formatMoney(1234.5, "USD", { symbol: false })).toBe("1,234.50");
  });

  it("never prints NaN or a negative zero", () => {
    expect(formatMoney(Number.NaN, "USD")).toBe("$0.00");
    expect(formatMoney(-0, "USD")).toBe("$0.00");
  });
});

describe("formatDate", () => {
  it("supports every template date format", () => {
    expect(formatDate("2026-09-03", "long")).toBe("September 3, 2026");
    expect(formatDate("2026-09-03", "european")).toBe("3 September 2026");
    expect(formatDate("2026-09-03", "numeric")).toBe("03/09/2026");
    expect(formatDate("2026-09-03", "iso")).toBe("2026-09-03");
  });

  it("does not shift the calendar day with the time zone", () => {
    expect(formatDate("2026-01-01", "long")).toBe("January 1, 2026");
  });

  it("prints a dash for anything that is not a date", () => {
    expect(formatDate("", "long")).toBe("—");
    expect(formatDate("2026-13-45", "long")).toBe("—");
  });

  it("offers each format as today's date", () => {
    expect(dateFormatOptions("2026-09-14").map((option) => option.label)).toEqual([
      "September 14, 2026",
      "14 September 2026",
      "14/09/2026",
      "2026-09-14",
    ]);
  });
});

describe("small formatters", () => {
  it("print percentages and quantities the way invoices do", () => {
    expect(formatPercent(4.7)).toBe("4.70%");
    expect(formatQuantity(3.5)).toBe("3.5");
    expect(formatQuantity(1200)).toBe("1,200");
  });
});
