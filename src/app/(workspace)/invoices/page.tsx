import type { Metadata } from "next";
import { InvoicesView } from "@/views/invoices/ui/invoices-view";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return <InvoicesView />;
}
