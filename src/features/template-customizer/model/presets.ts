import type { TemplateConfig } from "./schema";

export const defaultTemplateConfig: TemplateConfig = {
  name: "Standard template",
  brandColor: "#0b5d3b",
  inkColor: "#111111",
  paperTint: "#ffffff",
  logo: {
    show: true,
    src: null,
    monogram: "NF",
    shape: "square",
    size: 64,
  },
  typeface: "grotesque",
  typeScale: 100,
  headerLayout: "split",
  ruleWeight: "hairline",
  density: "regular",
  accentBand: true,
  content: {
    documentTitle: "Invoice",
    currency: "EUR",
    dateFormat: "long",
    showDueDate: true,
    showPurchaseOrder: false,
    showItemDescription: true,
    showQuantity: true,
    showDiscount: true,
    showTaxes: true,
    showPaymentMade: true,
    showTerms: true,
    terms:
      "Payment is due within 14 days. Late payments accrue statutory interest from the due date.",
    showStatement: true,
    statement: "Thank you for your business. Bank details are on the payment page.",
    showPageFooter: true,
  },
};

export type TemplatePreset = {
  id: string;
  name: string;
  description: string;
  swatch: string;
  apply: (config: TemplateConfig) => TemplateConfig;
};

/** Presets change look, never content the accountant has typed. */
export const templatePresets: TemplatePreset[] = [
  {
    id: "bureau",
    name: "Bureau",
    description: "Split header, hairline rules, deep green accent band.",
    swatch: "#0b5d3b",
    apply: (config) => ({
      ...config,
      brandColor: "#0b5d3b",
      inkColor: "#111111",
      paperTint: "#ffffff",
      typeface: "grotesque",
      typeScale: 100,
      headerLayout: "split",
      ruleWeight: "hairline",
      density: "regular",
      accentBand: true,
      logo: { ...config.logo, shape: "square", size: 64 },
    }),
  },
  {
    id: "kontrast",
    name: "Kontrast",
    description: "Full-width banner, bold rules, black on signal red.",
    swatch: "#c81e14",
    apply: (config) => ({
      ...config,
      brandColor: "#c81e14",
      inkColor: "#000000",
      paperTint: "#ffffff",
      typeface: "grotesque",
      typeScale: 108,
      headerLayout: "banner",
      ruleWeight: "bold",
      density: "compact",
      accentBand: true,
      logo: { ...config.logo, shape: "square", size: 72 },
    }),
  },
  {
    id: "ledger",
    name: "Ledger",
    description: "Serif figures on warm paper, no accent band.",
    swatch: "#1f3a6e",
    apply: (config) => ({
      ...config,
      brandColor: "#1f3a6e",
      inkColor: "#1a1a18",
      paperTint: "#fbf8f1",
      typeface: "serif",
      typeScale: 104,
      headerLayout: "stacked",
      ruleWeight: "hairline",
      density: "airy",
      accentBand: false,
      logo: { ...config.logo, shape: "circle", size: 56 },
    }),
  },
  {
    id: "plain",
    name: "Plain",
    description: "No rules, no band, monogram only. For plain-paper mailing.",
    swatch: "#4a4a45",
    apply: (config) => ({
      ...config,
      brandColor: "#4a4a45",
      inkColor: "#222222",
      paperTint: "#ffffff",
      typeface: "grotesque",
      typeScale: 96,
      headerLayout: "stacked",
      ruleWeight: "none",
      density: "airy",
      accentBand: false,
      logo: { ...config.logo, shape: "bare", size: 48 },
    }),
  },
];
