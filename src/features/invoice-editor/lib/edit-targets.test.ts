import { describe, expect, it } from "vitest";
import { resolveEditTarget } from "./edit-targets";

describe("resolveEditTarget", () => {
  it("edits line items in place, with the currency next to the rate", () => {
    expect(resolveEditTarget("item.2.rate", "EUR")).toEqual({
      kind: "field",
      label: "Line 3 · Rate",
      path: "items.2.rate",
      fieldId: "item-2-rate",
      input: "number",
      suffix: "EUR",
    });
    expect(resolveEditTarget("item.0.description", "EUR")).toMatchObject({
      input: "textarea",
      fieldId: "item-0-description",
    });
  });

  it("sends dates to the calendar in the form", () => {
    expect(resolveEditTarget("meta.dueDate", "USD")).toEqual({
      kind: "jump",
      fieldId: "due-date",
      openPicker: true,
    });
  });

  it("points template and company parts to the screens that own them", () => {
    expect(resolveEditTarget("logo", "USD")).toEqual({ kind: "template", label: "Logo" });
    expect(resolveEditTarget("seller", "USD")).toEqual({ kind: "company" });
  });

  it("ignores unknown keys", () => {
    expect(resolveEditTarget("item.x.rate", "USD")).toBeNull();
    expect(resolveEditTarget("nothing", "USD")).toBeNull();
  });
});
