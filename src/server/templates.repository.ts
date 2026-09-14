import "server-only";

import {
  templateConfigSchema,
  type TemplateConfig,
  type TemplateRecord,
} from "@/features/template-customizer/model/schema";
import { defaultTemplateConfig } from "@/features/template-customizer/model/presets";

/**
 * Stands in for the accounting backend. Module-level state survives between
 * requests in a single server process, which is all a demo needs — swap this
 * file for a Prisma/NestJS client and nothing above it changes.
 */
const store = new Map<string, TemplateRecord>([
  [
    "standard",
    {
      id: "standard",
      updatedAt: new Date("2026-09-01T09:00:00Z").toISOString(),
      ...defaultTemplateConfig,
    },
  ],
]);

export async function getTemplate(id: string): Promise<TemplateRecord | null> {
  return store.get(id) ?? null;
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  return [...store.values()];
}

export async function saveTemplate(
  id: string,
  input: unknown,
): Promise<
  { ok: true; record: TemplateRecord } | { ok: false; errors: Record<string, string> }
> {
  const parsed = templateConfigSchema.safeParse(input);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors };
  }

  const record: TemplateRecord = {
    id,
    updatedAt: new Date().toISOString(),
    ...(parsed.data as TemplateConfig),
  };

  store.set(id, record);
  return { ok: true, record };
}
