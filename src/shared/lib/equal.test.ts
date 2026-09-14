import { describe, expect, it } from "vitest";
import { deepEqual } from "./equal";
import { countErrors, firstErrorMessage } from "./form-errors";

describe("deepEqual", () => {
  it("compares plain form data structurally", () => {
    expect(deepEqual({ a: [1, { b: "x" }] }, { a: [1, { b: "x" }] })).toBe(true);
    expect(deepEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual([], {})).toBe(false);
  });

  it("treats NaN as equal to itself, like an empty number field", () => {
    expect(deepEqual({ rate: Number.NaN }, { rate: Number.NaN })).toBe(true);
  });
});

describe("form error helpers", () => {
  const errors = {
    customer: { name: { type: "too_small", message: "Who is this invoice for?" } },
    items: [
      undefined,
      { rate: { type: "invalid_type", message: "Enter a rate", ref: {} } },
    ],
    dueDate: { type: "custom", message: "Due date can't be before the issue date" },
  };

  it("count every message in a nested tree", () => {
    expect(countErrors(errors as never)).toBe(3);
  });

  it("find the first message in field order", () => {
    expect(firstErrorMessage(errors as never)).toBe("Who is this invoice for?");
    expect(firstErrorMessage({})).toBeUndefined();
  });
});
