import {
  resolveEditTarget,
  type FieldEdit,
} from "@/features/invoice-editor/lib/edit-targets";
import {
  studioTarget,
  type StudioTarget,
} from "@/features/template-editor/lib/pick-targets";

/** What a click on the composer's sheet does. */
export type ComposerTarget =
  /** Invoice text or number: edited in place, right on the sheet. */
  | { kind: "invoice-field"; spec: FieldEdit }
  /** The document title belongs to the template, but is still edited in place. */
  | { kind: "template-title" }
  /** Dates and totals: reveal the control in the Invoice panel. */
  | { kind: "invoice-control"; fieldId: string; openPicker?: boolean }
  /** Logo, labels, payment block…: reveal the setting in the Design panel. */
  | { kind: "design"; target: StudioTarget }
  /** The seller block comes from Settings. */
  | { kind: "company" };

export function resolveComposerTarget(
  key: string,
  currency: string,
): ComposerTarget | null {
  if (key === "title") return { kind: "template-title" };

  const edit = resolveEditTarget(key, currency);
  if (edit?.kind === "field") return { kind: "invoice-field", spec: edit };
  if (edit?.kind === "jump") {
    return { kind: "invoice-control", fieldId: edit.fieldId, openPicker: edit.openPicker };
  }
  if (edit?.kind === "company") return { kind: "company" };

  const design = studioTarget(key);
  return design ? { kind: "design", target: design } : null;
}

/** Keys that open the in-place editor, in the order Tab walks through them. */
export const isInlineTarget = (target: ComposerTarget | null) =>
  target?.kind === "invoice-field" || target?.kind === "template-title";
