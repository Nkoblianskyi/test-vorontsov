import type { Metadata } from "next";
import { StudioEditor } from "@/features/template-editor/ui/studio/studio-editor";

export const metadata: Metadata = { title: "Customize template" };

export default async function TemplateStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudioEditor templateId={id} />;
}
