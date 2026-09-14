import { describe, expect, it } from "vitest";
import { displayStatus, isOpenStatus, type DisplayStatus } from "./status";

const today = "2026-09-14";
const sent = { status: "sent" as const, dueDate: "2026-09-20", amountPaid: 0 };

describe("displayStatus", () => {
  it("keeps drafts as drafts, whatever the dates say", () => {
    expect(
      displayStatus({ ...sent, status: "draft", dueDate: "2020-01-01" }, 100, today),
    ).toBe("draft");
  });

  it("adds what the calendar says to sent invoices", () => {
    expect(displayStatus(sent, 100, today)).toBe("sent");
    expect(displayStatus({ ...sent, dueDate: "2026-09-13" }, 100, today)).toBe("overdue");
    expect(displayStatus({ ...sent, amountPaid: 40 }, 60, today)).toBe("partial");
  });

  it("is not overdue on the due date itself", () => {
    expect(displayStatus({ ...sent, dueDate: today }, 100, today)).toBe("sent");
  });

  it("lets the balance decide whether an invoice is paid", () => {
    expect(displayStatus({ ...sent, dueDate: "2026-01-01" }, 0, today)).toBe("paid");
    expect(displayStatus({ ...sent, status: "paid" }, 0, today)).toBe("paid");
    // Marked paid, then lines were added: money is owed again.
    expect(displayStatus({ ...sent, status: "paid", amountPaid: 100 }, 50, today)).toBe(
      "partial",
    );
  });

  it("counts sent, partly paid and overdue as open", () => {
    const open: DisplayStatus[] = ["sent", "partial", "overdue"];
    expect(open.every(isOpenStatus)).toBe(true);
    expect(isOpenStatus("paid")).toBe(false);
    expect(isOpenStatus("draft")).toBe(false);
  });
});
