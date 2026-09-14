import { describe, expect, it } from "vitest";
import { auditContrast, contrastRatio, mix, normalizeHex, readableInk } from "./color";

describe("normalizeHex", () => {
  it("expands short hex and lowercases", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("2C3DD8")).toBe("#2c3dd8");
  });

  it("rejects anything else", () => {
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("blue")).toBeNull();
  });
});

describe("contrast", () => {
  it("follows WCAG 2.1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("picks white text on dark brand colours and dark text on light ones", () => {
    expect(readableInk("#2c3dd8")).toBe("#ffffff");
    expect(readableInk("#ffd400")).toBe("#111111");
  });

  it("explains the verdict in levels", () => {
    expect(auditContrast("#111111", "#ffffff", "Text").level).toBe("aaa");
    expect(auditContrast("#767676", "#ffffff", "Text").level).toBe("aa");
    expect(auditContrast("#999999", "#ffffff", "Text").level).toBe("fail");
  });
});

describe("mix", () => {
  it("blends two colours and clamps the amount", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#000000", "#ffffff", 2)).toBe("#ffffff");
  });
});
