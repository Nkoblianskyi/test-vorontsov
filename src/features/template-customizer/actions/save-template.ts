"use server";

import { revalidatePath } from "next/cache";
import { saveTemplate } from "@/server/templates.repository";
import type { TemplateConfig } from "../model/schema";

export type SaveResult =
  | { status: "saved"; updatedAt: string }
  | { status: "invalid"; errors: Record<string, string> };

export async function saveTemplateAction(
  id: string,
  config: TemplateConfig,
): Promise<SaveResult> {
  const result = await saveTemplate(id, config);

  if (!result.ok) {
    return { status: "invalid", errors: result.errors };
  }

  revalidatePath(`/templates/${id}`);
  return { status: "saved", updatedAt: result.record.updatedAt };
}
