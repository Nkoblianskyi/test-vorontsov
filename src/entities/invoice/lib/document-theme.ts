import type { CSSProperties } from "react";
import type { TemplateConfig } from "@/entities/template/@x/invoice";
import { mix, readableInk } from "@/shared/lib/color";
import { documentFonts } from "./document-fonts";

const densityScale = {
  compact: { pad: "14mm", block: "6mm", row: "2.6mm" },
  regular: { pad: "18mm", block: "9mm", row: "3.6mm" },
  airy: { pad: "24mm", block: "13mm", row: "4.8mm" },
} as const;

const ruleWidth = {
  none: "0px",
  hairline: "1px",
  bold: "2px",
} as const;

/**
 * The Swiss sheet is themed through CSS custom properties, so a colour change
 * repaints it without re-rendering the React tree below.
 */
export function swissDocumentStyle(config: TemplateConfig): CSSProperties {
  const density = densityScale[config.density];
  const base = 9.6 * (config.typeScale / 100);

  return {
    "--doc-brand": config.primaryColor,
    "--doc-brand-ink": readableInk(config.primaryColor),
    "--doc-secondary": config.secondaryColor,
    "--doc-secondary-ink": readableInk(config.secondaryColor),
    "--doc-ink": config.inkColor,
    "--doc-ink-soft": mix(config.inkColor, config.paperTint, 0.42),
    "--doc-paper": config.paperTint,
    "--doc-rule": mix(config.inkColor, config.paperTint, 0.75),
    "--doc-rule-strong": config.inkColor,
    "--doc-rule-width": ruleWidth[config.ruleWeight],
    "--doc-pad": density.pad,
    "--doc-block": density.block,
    "--doc-row": density.row,
    fontFamily: documentFonts[config.typeface],
    fontSize: `${base}pt`,
    color: config.inkColor,
    background: config.paperTint,
  } as CSSProperties;
}
