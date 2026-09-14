import type { TemplateConfig } from "@/entities/template/@x/invoice";

/** CSS font stacks for the template's typeface setting; the variables come from the root layout. */
export const documentFonts: Record<TemplateConfig["typeface"], string> = {
  system: "var(--font-system)",
  grotesque: "var(--font-sans)",
  serif: "var(--font-serif)",
};
