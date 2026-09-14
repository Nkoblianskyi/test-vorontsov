import type { Metadata } from "next";
import { InvoiceEditor } from "@/features/invoice-editor/ui/invoice-editor";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceEditor invoiceId={id} />;
}
