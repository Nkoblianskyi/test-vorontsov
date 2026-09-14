import { notFound } from "next/navigation";

import { getTemplate } from "@/server/templates.repository";
import { Customizer } from "@/features/template-customizer/ui/customizer";
import type { TemplateConfig } from "@/features/template-customizer/model/schema";

export const dynamic = "force-dynamic";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getTemplate(id);

  if (!record) notFound();

  const { id: _id, updatedAt, ...config } = record;

  return (
    <Customizer
      templateId={id}
      initialConfig={config as TemplateConfig}
      initialUpdatedAt={updatedAt}
    />
  );
}
