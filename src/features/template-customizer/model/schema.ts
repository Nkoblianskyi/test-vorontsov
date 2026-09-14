import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex colour, for example #0B5D3B");

export const documentTypefaceValues = ["grotesque", "serif"] as const;
export const headerLayoutValues = ["stacked", "split", "banner"] as const;
export const ruleWeightValues = ["hairline", "bold", "none"] as const;
export const densityValues = ["compact", "regular", "airy"] as const;
export const logoShapeValues = ["square", "circle", "bare"] as const;
export const currencyValues = ["USD", "EUR", "PLN", "UAH"] as const;
export const dateFormatValues = ["long", "numeric", "iso"] as const;

export const templateConfigSchema = z.object({
  name: z.string().trim().min(1, "Give the template a name").max(60),

  brandColor: hexColor,
  inkColor: hexColor,
  paperTint: hexColor,

  logo: z.object({
    show: z.boolean(),
    src: z.string().nullable(),
    monogram: z.string().trim().max(3),
    shape: z.enum(logoShapeValues),
    size: z.number().int().min(40).max(120),
  }),

  typeface: z.enum(documentTypefaceValues),
  typeScale: z.number().int().min(90).max(115),
  headerLayout: z.enum(headerLayoutValues),
  ruleWeight: z.enum(ruleWeightValues),
  density: z.enum(densityValues),
  accentBand: z.boolean(),

  content: z.object({
    documentTitle: z.string().trim().min(1).max(28),
    currency: z.enum(currencyValues),
    dateFormat: z.enum(dateFormatValues),
    showDueDate: z.boolean(),
    showPurchaseOrder: z.boolean(),
    showItemDescription: z.boolean(),
    showQuantity: z.boolean(),
    showDiscount: z.boolean(),
    showTaxes: z.boolean(),
    showPaymentMade: z.boolean(),
    showTerms: z.boolean(),
    terms: z.string().max(400),
    showStatement: z.boolean(),
    statement: z.string().max(400),
    showPageFooter: z.boolean(),
  }),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;

export const templateRecordSchema = templateConfigSchema.extend({
  id: z.string(),
  updatedAt: z.string(),
});

export type TemplateRecord = z.infer<typeof templateRecordSchema>;
