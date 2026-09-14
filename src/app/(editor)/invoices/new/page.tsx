import type { Metadata } from "next";
import { InvoiceEditor } from "@/features/invoice-editor/ui/invoice-editor";

export const metadata: Metadata = { title: "New invoice" };

export default function NewInvoicePage() {
  return <InvoiceEditor />;
}
