export type InvoiceParty = {
  name: string;
  lines: string[];
  taxId?: string;
};

export type InvoiceLineItem = {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
};

export type InvoiceTax = {
  label: string;
  rate: number;
};

export type Invoice = {
  number: string;
  purchaseOrder: string;
  issuedAt: string;
  dueAt: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  items: InvoiceLineItem[];
  discountRate: number;
  taxes: InvoiceTax[];
  amountPaid: number;
};

/** Sample data the preview renders. Realistic numbers make layout problems visible. */
export const sampleInvoice: Invoice = {
  number: "2026-0184",
  purchaseOrder: "PO-4471",
  issuedAt: "2026-09-01",
  dueAt: "2026-09-15",
  seller: {
    name: "Northfield Bookkeeping",
    lines: ["Marszałkowska 84/92", "00-514 Warsaw", "Poland"],
    taxId: "PL 524 298 2251",
  },
  buyer: {
    name: "Lantern Goods Sp. z o.o.",
    lines: ["Plac Bankowy 2", "00-095 Warsaw", "Poland"],
    taxId: "PL 701 088 4412",
  },
  items: [
    {
      id: "li-1",
      title: "Monthly bookkeeping",
      description: "Ledger upkeep, bank reconciliation, VAT register for August",
      quantity: 1,
      unit: "month",
      rate: 1450,
    },
    {
      id: "li-2",
      title: "Payroll run",
      description: "12 employees, ZUS and PIT filings",
      quantity: 12,
      unit: "person",
      rate: 38,
    },
    {
      id: "li-3",
      title: "Year-end advisory",
      description: "Depreciation schedule review and closing entries",
      quantity: 3.5,
      unit: "hour",
      rate: 120,
    },
  ],
  discountRate: 5,
  taxes: [
    { label: "VAT", rate: 23 },
    { label: "Local levy", rate: 1.5 },
  ],
  amountPaid: 600,
};
