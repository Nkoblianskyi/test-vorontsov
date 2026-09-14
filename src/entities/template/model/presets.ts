import type {
  ContentField,
  ContentFieldKey,
  TemplateConfig,
  TemplateRecord,
} from "./schema";

const field = (label: string, show = true): ContentField => ({ show, label });

/** Labels follow the reference word for word, including its capitalisation. */
export const defaultContentFields: Record<ContentFieldKey, ContentField> = {
  invoiceNumber: field("Invoice number"),
  issueDate: field("Date of Issue"),
  dueDate: field("Due Date"),
  reference: field("Reference", false),
  companyAddress: field(""),
  billedTo: field("Billed To"),
  itemName: field("Item"),
  itemDescription: field("Description"),
  itemQuantity: field("Qty", false),
  itemRate: field("Rate"),
  itemTotal: field("Total"),
  subtotal: field("Subtotal"),
  discount: field("Discount"),
  taxes: field(""),
  total: field("Total"),
  paymentMade: field("Payment Made"),
  balanceDue: field("Balance Due"),
  paymentDetails: field("Payment details"),
  terms: field("Terms & Conditions"),
  statement: field("Statement"),
  pageFooter: field("", false),
};

export const defaultTemplateConfig: TemplateConfig = {
  name: "Standard Template",
  design: "classic",
  primaryColor: "#2c3dd8",
  secondaryColor: "#2c3dd8",
  inkColor: "#111111",
  paperTint: "#ffffff",
  logo: { show: true, src: null, monogram: "NS", shape: "square", size: 64 },
  typeface: "system",
  typeScale: 100,
  headerLayout: "split",
  ruleWeight: "hairline",
  density: "regular",
  accentBand: true,
  payments: {
    bankTransfer: {
      enabled: false,
      details: "Northfield Bank · Account 0048 2210 9931 · Routing 031 100 209",
    },
    card: { enabled: false },
    paypal: { enabled: false, email: "" },
  },
  content: {
    documentTitle: "Invoice",
    dateFormat: "long",
    fields: defaultContentFields,
    terms:
      "All services provided are non-refundable. For any disputes, please contact us within 7 days of receiving this invoice.",
    statement: "Thank you for your business. We look forward to working with you again!",
  },
};

type Look = Pick<
  TemplateConfig,
  | "design"
  | "primaryColor"
  | "secondaryColor"
  | "inkColor"
  | "paperTint"
  | "typeface"
  | "typeScale"
  | "headerLayout"
  | "ruleWeight"
  | "density"
  | "accentBand"
> & { logoShape: TemplateConfig["logo"]["shape"]; logoSize: number };

export type TemplatePreset = {
  id: string;
  name: string;
  description: string;
  look: Look;
};

/** Presets change how the sheet looks, never the words the accountant typed. */
export const templatePresets: TemplatePreset[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Classic layout: colour rule on top, logo block on the right.",
    look: {
      design: "classic",
      primaryColor: "#2c3dd8",
      secondaryColor: "#2c3dd8",
      inkColor: "#111111",
      paperTint: "#ffffff",
      typeface: "system",
      typeScale: 100,
      headerLayout: "split",
      ruleWeight: "hairline",
      density: "regular",
      accentBand: true,
      logoShape: "square",
      logoSize: 64,
    },
  },
  {
    id: "bureau",
    name: "Bureau",
    description: "Swiss grid, hairline rules, deep green band.",
    look: {
      design: "swiss",
      primaryColor: "#0b5d3b",
      secondaryColor: "#0b5d3b",
      inkColor: "#111111",
      paperTint: "#ffffff",
      typeface: "grotesque",
      typeScale: 100,
      headerLayout: "split",
      ruleWeight: "hairline",
      density: "regular",
      accentBand: true,
      logoShape: "square",
      logoSize: 64,
    },
  },
  {
    id: "kontrast",
    name: "Kontrast",
    description: "Full-width banner, bold rules, red and black.",
    look: {
      design: "swiss",
      primaryColor: "#c81e14",
      secondaryColor: "#111111",
      inkColor: "#000000",
      paperTint: "#ffffff",
      typeface: "grotesque",
      typeScale: 106,
      headerLayout: "banner",
      ruleWeight: "bold",
      density: "compact",
      accentBand: true,
      logoShape: "square",
      logoSize: 72,
    },
  },
  {
    id: "ledger",
    name: "Ledger",
    description: "Serif figures on warm paper, no band.",
    look: {
      design: "swiss",
      primaryColor: "#1f3a6e",
      secondaryColor: "#7a4b12",
      inkColor: "#1a1a18",
      paperTint: "#fbf8f1",
      typeface: "serif",
      typeScale: 104,
      headerLayout: "stacked",
      ruleWeight: "hairline",
      density: "airy",
      accentBand: false,
      logoShape: "circle",
      logoSize: 56,
    },
  },
];

export function applyPreset(
  config: TemplateConfig,
  preset: TemplatePreset,
): TemplateConfig {
  const { logoShape, logoSize, ...look } = preset.look;
  return { ...config, ...look, logo: { ...config.logo, shape: logoShape, size: logoSize } };
}

export function matchesPreset(config: TemplateConfig, preset: TemplatePreset): boolean {
  const { logoShape, logoSize, ...look } = preset.look;
  return (
    config.logo.shape === logoShape &&
    config.logo.size === logoSize &&
    (Object.keys(look) as (keyof typeof look)[]).every((key) => config[key] === look[key])
  );
}

const SEED_DATE = "2026-09-01T09:00:00.000Z";

function seed(id: string, config: TemplateConfig): TemplateRecord {
  return { ...structuredClone(config), id, createdAt: SEED_DATE, updatedAt: SEED_DATE };
}

export function seedTemplates(): TemplateRecord[] {
  const preset = (id: string) => templatePresets.find((item) => item.id === id)!;
  return [
    seed("standard", defaultTemplateConfig),
    seed("bureau", {
      ...applyPreset(defaultTemplateConfig, preset("bureau")),
      name: "Bureau",
      content: {
        ...defaultTemplateConfig.content,
        fields: {
          ...defaultContentFields,
          companyAddress: field("From"),
          itemQuantity: field("Qty"),
          pageFooter: field("", true),
        },
        terms:
          "Payment is due within 14 days. Late payments accrue statutory interest from the due date.",
        statement: "Thank you for your business.",
      },
      payments: {
        ...defaultTemplateConfig.payments,
        bankTransfer: { ...defaultTemplateConfig.payments.bankTransfer, enabled: true },
      },
    }),
    seed("ledger", {
      ...applyPreset(defaultTemplateConfig, preset("ledger")),
      name: "Ledger",
      content: {
        ...defaultTemplateConfig.content,
        dateFormat: "european",
        fields: { ...defaultContentFields, itemQuantity: field("Hours") },
      },
    }),
  ];
}
