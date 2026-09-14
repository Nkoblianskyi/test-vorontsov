import type { CompanyProfile } from "@/entities/company/model/store";
import type { Currency } from "@/shared/lib/format";
import type { DiscountType, InvoiceInput } from "./schema";

/** What a sheet needs to render: plain data, no template, no store. */
export type DocumentParty = {
  name: string;
  lines: string[];
  taxId?: string;
};

export type DocumentItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceDocumentData = {
  number: string;
  issueDate: string;
  dueDate: string;
  reference: string;
  currency: Currency;
  seller: DocumentParty;
  buyer: DocumentParty;
  items: DocumentItem[];
  discount: { type: DiscountType; value: number };
  taxes: { id: string; name: string; rate: number }[];
  amountPaid: number;
  terms: string;
  statement: string;
};

const splitLines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function sellerParty(company: CompanyProfile): DocumentParty {
  return {
    name: company.name.trim() || "Your company",
    lines: [...splitLines(company.address), company.phone.trim(), company.email.trim()].filter(
      Boolean,
    ),
    taxId: company.taxId.trim() || undefined,
  };
}

/**
 * Form values can be half-typed. With `placeholders`, empty fields render as grey
 * stand-ins so the live preview keeps its shape while the invoice is being written.
 */
export function toDocumentData(
  invoice: Partial<InvoiceInput>,
  company: CompanyProfile,
  { placeholders = false }: { placeholders?: boolean } = {},
): InvoiceDocumentData {
  const customer = invoice.customer ?? { name: "", email: "", address: "", taxId: "" };

  return {
    number: invoice.number?.trim() || (placeholders ? "INV-0000" : ""),
    issueDate: invoice.issueDate ?? "",
    dueDate: invoice.dueDate ?? "",
    reference: invoice.reference ?? "",
    currency: invoice.currency ?? "USD",
    seller: sellerParty(company),
    buyer: {
      name: customer.name?.trim() || (placeholders ? "Customer name" : "—"),
      lines: [...splitLines(customer.address ?? ""), customer.email?.trim() ?? ""].filter(Boolean),
      taxId: customer.taxId?.trim() || undefined,
    },
    items: (invoice.items ?? []).map((item, index) => ({
      id: item?.id ?? String(index),
      name: item?.name?.trim() || (placeholders ? "Untitled item" : ""),
      description: item?.description ?? "",
      quantity: item?.quantity ?? 0,
      rate: item?.rate ?? 0,
    })),
    discount: invoice.discount ?? { type: "percent", value: 0 },
    taxes: invoice.taxes ?? [],
    amountPaid: invoice.amountPaid ?? 0,
    terms: invoice.terms ?? "",
    statement: invoice.statement ?? "",
  };
}
