import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { statusLabels, type DisplayStatus } from "../lib/status";

const tones: Record<DisplayStatus, BadgeTone> = {
  draft: "faint",
  sent: "ink",
  partial: "ink",
  overdue: "signal",
  paid: "positive",
};

export function InvoiceStatusBadge({ status }: { status: DisplayStatus }) {
  return <Badge tone={tones[status]}>{statusLabels[status]}</Badge>;
}
