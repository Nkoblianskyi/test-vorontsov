export type TotalsInput = {
  items: { quantity: number; rate: number }[];
  discount: { type: "percent" | "amount"; value: number };
  taxes: { name: string; rate: number }[];
  amountPaid: number;
};

export type InvoiceTotals = {
  /** Amount per line, in the same order as `items`. */
  lines: number[];
  subtotal: number;
  discount: number;
  net: number;
  taxes: { name: string; rate: number; amount: number }[];
  total: number;
  paid: number;
  balance: number;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const num = (value: number | undefined) => (Number.isFinite(value) ? (value as number) : 0);
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/**
 * Money is rounded to cents at every step, the way it is printed, so the lines
 * on the sheet always add up to the total on the sheet.
 * Inputs may be half-typed form values: empty numbers count as zero.
 */
export function computeTotals(input: Partial<TotalsInput>): InvoiceTotals {
  const lines = (input.items ?? []).map((item) => round2(num(item?.quantity) * num(item?.rate)));
  const subtotal = round2(sum(lines));

  const discountValue = Math.max(0, num(input.discount?.value));
  const discount = round2(
    input.discount?.type === "amount"
      ? Math.min(discountValue, subtotal)
      : (subtotal * Math.min(discountValue, 100)) / 100,
  );
  const net = round2(subtotal - discount);

  const taxes = (input.taxes ?? []).map((tax) => ({
    name: tax?.name ?? "",
    rate: num(tax?.rate),
    amount: round2((net * num(tax?.rate)) / 100),
  }));

  const total = round2(net + sum(taxes.map((tax) => tax.amount)));
  const paid = round2(Math.max(0, num(input.amountPaid)));

  return { lines, subtotal, discount, net, taxes, total, paid, balance: round2(total - paid) };
}
