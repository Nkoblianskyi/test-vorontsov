import { z } from "zod";
import { dateFormatValues } from "@/shared/lib/format";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex colour, for example #2C3DD8");

/** Base layout of the sheet. "classic" is the reference layout, "swiss" is ours. */
export const designValues = ["classic", "swiss"] as const;
export const typefaceValues = ["system", "grotesque", "serif"] as const;
export const headerLayoutValues = ["split", "stacked", "banner"] as const;
export const ruleWeightValues = ["hairline", "bold", "none"] as const;
export const densityValues = ["compact", "regular", "airy"] as const;
export const logoShapeValues = ["square", "circle", "bare"] as const;

/** Every piece of text on the sheet that can be hidden or renamed. */
export const contentFieldKeys = [
  "invoiceNumber",
  "issueDate",
  "dueDate",
  "reference",
  "companyAddress",
  "billedTo",
  "itemName",
  "itemDescription",
  "itemQuantity",
  "itemRate",
  "itemTotal",
  "subtotal",
  "discount",
  "taxes",
  "total",
  "paymentMade",
  "balanceDue",
  "paymentDetails",
  "terms",
  "statement",
  "pageFooter",
] as const;

export type ContentFieldKey = (typeof contentFieldKeys)[number];

const contentFieldSchema = z.object({
  show: z.boolean(),
  label: z.string().max(40, "Keep labels under 40 characters"),
});

export type ContentField = z.infer<typeof contentFieldSchema>;

const fieldsShape = Object.fromEntries(
  contentFieldKeys.map((key) => [key, contentFieldSchema]),
) as Record<ContentFieldKey, typeof contentFieldSchema>;

const paymentsSchema = z
  .object({
    bankTransfer: z.object({ enabled: z.boolean(), details: z.string().max(300) }),
    card: z.object({ enabled: z.boolean() }),
    paypal: z.object({ enabled: z.boolean(), email: z.string().trim().max(80) }),
  })
  .superRefine((value, ctx) => {
    if (value.bankTransfer.enabled && !value.bankTransfer.details.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bankTransfer", "details"],
        message: "Add the account customers transfer to",
      });
    }
    if (value.paypal.enabled && !z.string().email().safeParse(value.paypal.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paypal", "email"],
        message: "Enter the PayPal email customers pay to",
      });
    }
  });

export const templateConfigSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the template a name")
    .max(60, "Keep the name under 60 characters"),
  design: z.enum(designValues),

  primaryColor: hexColor,
  secondaryColor: hexColor,
  inkColor: hexColor,
  paperTint: hexColor,

  logo: z.object({
    show: z.boolean(),
    src: z.string().nullable(),
    monogram: z.string().trim().max(3, "Up to three characters"),
    shape: z.enum(logoShapeValues),
    size: z.number().int().min(40).max(120),
  }),

  typeface: z.enum(typefaceValues),
  typeScale: z.number().int().min(90).max(115),
  headerLayout: z.enum(headerLayoutValues),
  ruleWeight: z.enum(ruleWeightValues),
  density: z.enum(densityValues),
  accentBand: z.boolean(),

  payments: paymentsSchema,

  content: z.object({
    documentTitle: z.string().trim().min(1, "The document needs a title").max(28),
    dateFormat: z.enum(dateFormatValues),
    fields: z.object(fieldsShape),
    terms: z.string().max(600, "Keep it under 600 characters"),
    statement: z.string().max(600, "Keep it under 600 characters"),
  }),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;

export type TemplateRecord = TemplateConfig & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export function toTemplateConfig(record: TemplateRecord): TemplateConfig {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...config } = record;
  return config;
}
