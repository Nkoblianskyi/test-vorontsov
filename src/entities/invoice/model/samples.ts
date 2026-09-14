import type { CompanyProfile } from "@/entities/company/model/store";
import { defaultTemplateConfig } from "@/entities/template/model/presets";
import { addDays, todayIso } from "@/shared/lib/dates";
import { computeTotals } from "../lib/totals";
import { sellerParty, type InvoiceDocumentData } from "./document";
import type { InvoiceInput, InvoiceRecord, InvoiceStatus } from "./schema";

/** The invoice from the reference screenshot, with totals that actually add up. */
export function referenceSample(
  company: CompanyProfile,
  today: string = todayIso(),
): InvoiceDocumentData {
  return {
    number: "INV-2026-0042",
    issueDate: today,
    dueDate: today,
    reference: "PO-7781",
    currency: "USD",
    seller: sellerParty(company),
    buyer: {
      name: "Harborline Logistics, Inc.",
      lines: ["2200 Market Street,", "Suite 410,", "Philadelphia, Pennsylvania 19103,", "United States,", "+1 215-555-0199"],
    },
    items: [
      {
        id: "sample-1",
        name: "Web development",
        description: "Website development with content and SEO optimization",
        quantity: 1,
        rate: 1000,
      },
    ],
    discount: { type: "percent", value: 0 },
    taxes: [
      { id: "t1", name: "Sales Tax", rate: 4.7 },
      { id: "t2", name: "City Tax", rate: 7 },
    ],
    amountPaid: 100,
    terms: "",
    statement: "",
  };
}

/** Several lines, a discount and long descriptions: shows how a layout holds up. */
export function detailedSample(
  company: CompanyProfile,
  today: string = todayIso(),
): InvoiceDocumentData {
  return {
    number: "INV-2026-0184",
    issueDate: today,
    dueDate: addDays(today, 14),
    reference: "PO-4471",
    currency: "EUR",
    seller: sellerParty(company),
    buyer: {
      name: "Lantern Goods Sp. z o.o.",
      lines: ["Plac Bankowy 2", "00-095 Warsaw", "Poland"],
      taxId: "PL 701 088 4412",
    },
    items: [
      {
        id: "d1",
        name: "Monthly bookkeeping",
        description: "Ledger upkeep, bank reconciliation and VAT register for August",
        quantity: 1,
        rate: 1450,
      },
      {
        id: "d2",
        name: "Payroll run",
        description: "12 employees, social security and income tax filings",
        quantity: 12,
        rate: 38,
      },
      {
        id: "d3",
        name: "Year-end advisory",
        description: "Depreciation schedule review and closing entries",
        quantity: 3.5,
        rate: 120,
      },
    ],
    discount: { type: "percent", value: 5 },
    taxes: [{ id: "v", name: "VAT", rate: 23 }],
    amountPaid: 600,
    terms: "",
    statement: "",
  };
}

type SeedSpec = {
  id: string;
  number: string;
  status: InvoiceStatus;
  issuedDaysAgo: number;
  termsDays: number;
  paidDaysAgo?: number;
  templateId: string;
  input: Pick<InvoiceInput, "currency" | "customer" | "items" | "discount" | "taxes"> &
    Partial<Pick<InvoiceInput, "amountPaid" | "reference">>;
};

const seeds: SeedSpec[] = [
  {
    id: "inv_seed_6",
    number: "INV-0006",
    status: "draft",
    issuedDaysAgo: 0,
    termsDays: 14,
    templateId: "standard",
    input: {
      currency: "USD",
      customer: {
        name: "Brightwater Café",
        email: "hello@brightwater.example",
        address: "17 Pier Road\nCape May, New Jersey 08204\nUnited States",
        taxId: "",
      },
      items: [
        { id: "i61", name: "Brand refresh", description: "Menu, signage and social templates", quantity: 1, rate: 2400 },
        { id: "i62", name: "Photography", description: "Half-day shoot, 30 edited images", quantity: 1, rate: 650 },
      ],
      discount: { type: "percent", value: 0 },
      taxes: [{ id: "t61", name: "Sales Tax", rate: 6.625 }],
    },
  },
  {
    id: "inv_seed_5",
    number: "INV-0005",
    status: "sent",
    issuedDaysAgo: 5,
    termsDays: 14,
    templateId: "standard",
    input: {
      currency: "USD",
      reference: "PO-2291",
      customer: {
        name: "Copperleaf Studio",
        email: "accounts@copperleaf.example",
        address: "910 Walnut Avenue\nAustin, Texas 78702\nUnited States",
        taxId: "",
      },
      items: [
        { id: "i51", name: "Web development", description: "Website development with content and SEO optimization", quantity: 1, rate: 1000 },
        { id: "i52", name: "Hosting setup", description: "Domain, SSL and deployment pipeline", quantity: 1, rate: 180 },
      ],
      discount: { type: "amount", value: 80 },
      taxes: [
        { id: "t51", name: "Sales Tax", rate: 4.7 },
        { id: "t52", name: "City Tax", rate: 7 },
      ],
    },
  },
  {
    id: "inv_seed_4",
    number: "INV-0004",
    status: "sent",
    issuedDaysAgo: 12,
    termsDays: 30,
    templateId: "standard",
    input: {
      currency: "USD",
      amountPaid: 500,
      customer: {
        name: "Meridian Dental Group",
        email: "billing@meridiandental.example",
        address: "3100 Ocean Parkway\nBrooklyn, New York 11235\nUnited States",
        taxId: "",
      },
      items: [
        { id: "i41", name: "Patient portal", description: "Appointment booking and reminders, phase one", quantity: 1, rate: 3200 },
        { id: "i42", name: "Support retainer", description: "Monthly, up to 10 hours", quantity: 1, rate: 450 },
      ],
      discount: { type: "percent", value: 0 },
      taxes: [],
    },
  },
  {
    id: "inv_seed_3",
    number: "INV-0003",
    status: "sent",
    issuedDaysAgo: 30,
    termsDays: 14,
    templateId: "bureau",
    input: {
      currency: "EUR",
      reference: "PO-4471",
      customer: {
        name: "Lantern Goods Sp. z o.o.",
        email: "faktury@lanterngoods.example",
        address: "Plac Bankowy 2\n00-095 Warsaw\nPoland",
        taxId: "PL 701 088 4412",
      },
      items: [
        { id: "i31", name: "Monthly bookkeeping", description: "Ledger upkeep, bank reconciliation and VAT register", quantity: 1, rate: 1450 },
        { id: "i32", name: "Payroll run", description: "12 employees, social security and income tax filings", quantity: 12, rate: 38 },
      ],
      discount: { type: "percent", value: 5 },
      taxes: [{ id: "t31", name: "VAT", rate: 23 }],
    },
  },
  {
    id: "inv_seed_2",
    number: "INV-0002",
    status: "paid",
    issuedDaysAgo: 41,
    termsDays: 30,
    paidDaysAgo: 12,
    templateId: "standard",
    input: {
      currency: "USD",
      customer: {
        name: "Harborline Logistics, Inc.",
        email: "ap@harborline.example",
        address: "2200 Market Street, Suite 410\nPhiladelphia, Pennsylvania 19103\nUnited States",
        taxId: "",
      },
      items: [
        { id: "i21", name: "Website redesign", description: "Discovery, UX and visual design for 12 page templates", quantity: 1, rate: 4200 },
        { id: "i22", name: "Content migration", description: "Moving 140 pages from the legacy CMS", quantity: 14, rate: 85 },
      ],
      discount: { type: "percent", value: 0 },
      taxes: [{ id: "t21", name: "Sales Tax", rate: 6 }],
    },
  },
  {
    id: "inv_seed_1",
    number: "INV-0001",
    status: "paid",
    issuedDaysAgo: 68,
    termsDays: 30,
    paidDaysAgo: 45,
    templateId: "ledger",
    input: {
      currency: "GBP",
      customer: {
        name: "Northwind Events Ltd",
        email: "finance@northwind.example",
        address: "22 Clerkenwell Green\nLondon EC1R 0DP\nUnited Kingdom",
        taxId: "GB 284 1170 32",
      },
      items: [
        { id: "i11", name: "Event microsite", description: "Registration flow and speaker pages", quantity: 36, rate: 70 },
      ],
      discount: { type: "percent", value: 10 },
      taxes: [{ id: "t11", name: "VAT", rate: 20 }],
    },
  },
];

const noon = (iso: string) => `${iso}T12:00:00.000Z`;

/** Demo data dated relative to today, so "overdue" and "due in 9 days" stay true whenever it runs. */
export function seedInvoices(today: string): InvoiceRecord[] {
  return seeds.map((spec) => {
    const issueDate = addDays(today, -spec.issuedDaysAgo);
    const dueDate = addDays(issueDate, spec.termsDays);
    const base: InvoiceInput = {
      number: spec.number,
      status: spec.status,
      templateId: spec.templateId,
      issueDate,
      dueDate,
      reference: "",
      amountPaid: 0,
      terms: defaultTemplateConfig.content.terms,
      statement: defaultTemplateConfig.content.statement,
      ...spec.input,
    };

    if (spec.status === "paid") {
      base.amountPaid = computeTotals(base).total;
    }

    return {
      ...base,
      id: spec.id,
      createdAt: noon(issueDate),
      updatedAt: noon(issueDate),
      sentAt: spec.status === "draft" ? null : noon(issueDate),
      paidAt: spec.paidDaysAgo !== undefined ? noon(addDays(today, -spec.paidDaysAgo)) : null,
    };
  });
}
