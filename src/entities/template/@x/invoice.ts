/**
 * Cross-import API (Feature-Sliced "@x" notation): the only part of the template
 * entity the invoice entity may use. An invoice sheet is rendered with a template;
 * the template never depends on invoices.
 */
export type { TemplateConfig } from "../model/schema";
export { defaultTemplateConfig } from "../model/presets";
export { LogoMark } from "../ui/logo-mark";
