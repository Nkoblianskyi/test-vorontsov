import type { TemplateConfig } from "@/entities/template/model/schema";

export const documentFonts: Record<TemplateConfig["typeface"], string> = {
  system: "var(--font-system)",
  grotesque: "var(--font-sans)",
  serif: "var(--font-serif)",
};
