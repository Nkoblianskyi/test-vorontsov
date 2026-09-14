import type { BadgeTone } from "@/shared/ui/badge";
import type { InvoiceStatus } from "../model/schema";

/** What the list shows. Stored status says what the user did; this adds what the calendar says. */
export type DisplayStatus = "draft" | "sent" | "partial" | "overdue" | "paid" | "void";

export function displayStatus(
  invoice: { status: InvoiceStatus; dueDate: string; amountPaid: number },
  balance: number,
  today: string,
): DisplayStatus {
  if (invoice.status === "void") return "void";
  if (invoice.status === "paid") return "paid";
  if (invoice.status === "draft") return "draft";
  if (balance <= 0) return "paid";
  if (invoice.dueDate < today) return "overdue";
  if (invoice.amountPaid > 0) return "partial";
  return "sent";
}

export const statusMeta: Record<DisplayStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "faint" },
  sent: { label: "Sent", tone: "ink" },
  partial: { label: "Partly paid", tone: "ink" },
  overdue: { label: "Overdue", tone: "signal" },
  paid: { label: "Paid", tone: "positive" },
  void: { label: "Void", tone: "neutral" },
};

export const isOpenStatus = (status: DisplayStatus) =>
  status === "sent" || status === "partial" || status === "overdue";
