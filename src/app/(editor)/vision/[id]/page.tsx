import type { Metadata } from "next";
import { Composer } from "@/views/composer/ui/composer";

export const metadata: Metadata = { title: "Composer" };

export default async function ComposerInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Composer key={id} invoiceId={id} />;
}
