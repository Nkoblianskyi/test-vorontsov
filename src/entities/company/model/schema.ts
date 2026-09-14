import { z } from "zod";
import { currencyValues } from "@/shared/lib/format";

/** The seller: printed on every invoice, edited once in Settings. */
export const companyProfileSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(80),
  address: z.string().max(300),
  email: z.union([z.literal(""), z.string().trim().email("That email looks incomplete")]),
  phone: z.string().max(40),
  taxId: z.string().max(40),
});

/** How a new invoice starts. */
export const invoicingDefaultsSchema = z.object({
  prefix: z
    .string()
    .trim()
    .min(1, "Add a prefix")
    .max(10, "10 characters at most")
    .regex(/^[A-Za-z0-9\-_/]+$/, "Letters, numbers, - _ and / only"),
  paymentTermsDays: z.number().int().min(0).max(120),
  currency: z.enum(currencyValues),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type InvoicingDefaults = z.infer<typeof invoicingDefaultsSchema>;
