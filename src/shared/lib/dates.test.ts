import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isIsoDate } from "./dates";

describe("addDays", () => {
  it("crosses month, year and leap-day boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("is not thrown off by daylight saving changes", () => {
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  });
});

describe("daysBetween", () => {
  it("counts whole days, negative when the second date is earlier", () => {
    expect(daysBetween("2026-09-01", "2026-09-15")).toBe(14);
    expect(daysBetween("2026-09-14", "2026-09-01")).toBe(-13);
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });
});

describe("isIsoDate", () => {
  it("accepts only YYYY-MM-DD", () => {
    expect(isIsoDate("2026-09-14")).toBe(true);
    expect(isIsoDate("14/09/2026")).toBe(false);
  });
});
