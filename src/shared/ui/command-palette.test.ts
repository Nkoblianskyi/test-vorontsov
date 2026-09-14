import { describe, expect, it } from "vitest";
import { filterCommands, type Command } from "./command-palette";

const command = (label: string, group: string, keywords?: string): Command => ({
  id: label,
  label,
  group,
  keywords,
  run: () => {},
});

const commands = [
  command("Mark as paid", "Invoice", "settle payment"),
  command("INV-0003 · Lantern Goods", "Go to"),
  command("Apply preset: Ledger", "Design", "serif"),
];

describe("filterCommands", () => {
  it("returns everything for an empty query", () => {
    expect(filterCommands(commands, "  ")).toHaveLength(3);
  });

  it("matches every word, in any order, across label, group and keywords", () => {
    expect(filterCommands(commands, "lantern 0003").map((c) => c.id)).toEqual([
      "INV-0003 · Lantern Goods",
    ]);
    expect(filterCommands(commands, "serif design").map((c) => c.id)).toEqual([
      "Apply preset: Ledger",
    ]);
    expect(filterCommands(commands, "PAYMENT").map((c) => c.id)).toEqual(["Mark as paid"]);
  });

  it("finds nothing when one word is missing", () => {
    expect(filterCommands(commands, "paid ledger")).toEqual([]);
  });
});
