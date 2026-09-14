import { describe, expect, it } from "vitest";
import { computeTotals, round2, type TotalsInput } from "./totals";

describe("round2", () => {
  it("rounds half-cents up even where binary floats fall short", () => {
    expect(round2(10.075)).toBe(10.08);
    expect(round2(3 * 3.335)).toBe(10.01);
    expect(round2(1.005)).toBe(1.01);
    expect(round2(-1.005)).toBe(-1.01);
    expect(Object.is(round2(-0.001), 0)).toBe(true);
  });
});

const base: TotalsInput = {
  items: [{ quantity: 1, rate: 1000 }],
  discount: { type: "percent", value: 0 },
  taxes: [],
  amountPaid: 0,
};

describe("computeTotals", () => {
  it("adds taxes on top and subtracts payments (the reference invoice, done right)", () => {
    const totals = computeTotals({
      ...base,
      taxes: [
        { name: "Sales Tax", rate: 4.7 },
        { name: "City Tax", rate: 7 },
      ],
      amountPaid: 100,
    });

    expect(totals.subtotal).toBe(1000);
    expect(totals.taxes.map((tax) => tax.amount)).toEqual([47, 70]);
    expect(totals.total).toBe(1117);
    expect(totals.balance).toBe(1017);
  });

  it("taxes the amount after the discount", () => {
    const totals = computeTotals({
      ...base,
      items: [{ quantity: 2, rate: 100 }],
      discount: { type: "percent", value: 10 },
      taxes: [{ name: "VAT", rate: 23 }],
    });

    expect(totals.discount).toBe(20);
    expect(totals.net).toBe(180);
    expect(totals.taxes[0].amount).toBe(41.4);
    expect(totals.total).toBe(221.4);
  });

  it("rounds every line to cents so printed lines add up to the printed total", () => {
    const totals = computeTotals({
      ...base,
      items: [
        { quantity: 3, rate: 0.1 },
        { quantity: 3.5, rate: 120 },
      ],
      taxes: [{ name: "VAT", rate: 23 }],
    });

    expect(totals.lines).toEqual([0.3, 420]);
    expect(totals.subtotal).toBe(420.3);
    expect(totals.taxes[0].amount).toBe(96.67);
    expect(totals.total).toBe(516.97);
  });

  it("caps a percentage discount at 100% and a fixed discount at the subtotal", () => {
    expect(
      computeTotals({ ...base, discount: { type: "percent", value: 150 } }).total,
    ).toBe(0);
    expect(
      computeTotals({ ...base, discount: { type: "amount", value: 5000 } }).discount,
    ).toBe(1000);
  });

  it("treats half-typed values as zero instead of printing NaN", () => {
    const totals = computeTotals({
      ...base,
      items: [{ quantity: Number.NaN, rate: 50 }],
      discount: { type: "percent", value: Number.NaN },
      amountPaid: Number.NaN,
    });

    expect(totals.subtotal).toBe(0);
    expect(totals.balance).toBe(0);
  });

  it("copes with missing parts of a form that is still loading", () => {
    expect(computeTotals({}).total).toBe(0);
  });
});
