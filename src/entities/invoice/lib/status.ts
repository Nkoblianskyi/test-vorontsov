import type { InvoiceStatus } from "../model/schema";

/** What the list shows. The stored status says what the user did; this adds money and the calendar. */
export type DisplayStatus = "draft" | "sent" | "partial" | "overdue" | "paid";

/** Anything under half a cent counts as settled. */
const SETTLED = 0.005;

export function displayStatus(
  invoice: { status: InvoiceStatus; dueDate: string; amountPaid: number },
  balance: number,
  today: string,
): DisplayStatus {
  if (invoice.status === "draft") return "draft";
  // Money decides "paid", not the stored flag: a paid invoice that owes again is open again.
  if (balance <= SETTLED) return "paid";
  if (invoice.dueDate < today) return "overdue";
  if (invoice.amountPaid > 0) return "partial";
  return "sent";
}

export const statusLabels: Record<DisplayStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partly paid",
  overdue: "Overdue",
  paid: "Paid",
};

export const isOpenStatus = (status: DisplayStatus) =>
  status === "sent" || status === "partial" || status === "overdue";
