import type { Metadata } from "next";
import { ReferenceEditor } from "@/features/template-editor/ui/reference/reference-editor";

export const metadata: Metadata = { title: "Customize (reference layout)" };

export default async function TemplateReferencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReferenceEditor templateId={id} />;
}
