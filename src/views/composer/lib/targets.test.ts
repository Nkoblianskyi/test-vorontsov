import { describe, expect, it } from "vitest";
import { isInlineTarget, resolveComposerTarget } from "./targets";

describe("resolveComposerTarget", () => {
  it("edits invoice text and the document title in place", () => {
    expect(resolveComposerTarget("item.1.name", "USD")).toMatchObject({
      kind: "invoice-field",
      spec: { path: "items.1.name" },
    });
    expect(resolveComposerTarget("title", "USD")).toEqual({ kind: "template-title" });
    expect(isInlineTarget(resolveComposerTarget("buyer.address", "USD"))).toBe(true);
  });

  it("reveals dates and totals in the invoice panel", () => {
    expect(resolveComposerTarget("meta.issueDate", "USD")).toEqual({
      kind: "invoice-control",
      fieldId: "issue-date",
      openPicker: true,
    });
    expect(resolveComposerTarget("total", "USD")).toEqual({
      kind: "invoice-control",
      fieldId: "summary",
      openPicker: undefined,
    });
  });

  it("sends template parts to the design panel and the seller to Settings", () => {
    expect(resolveComposerTarget("logo", "USD")).toEqual({
      kind: "design",
      target: { tab: "general", id: "section-logo" },
    });
    expect(resolveComposerTarget("labels", "USD")).toMatchObject({ kind: "design" });
    expect(resolveComposerTarget("seller", "USD")).toEqual({ kind: "company" });
  });

  it("ignores unknown keys", () => {
    expect(resolveComposerTarget("nothing", "USD")).toBeNull();
    expect(isInlineTarget(null)).toBe(false);
  });
});
