"use client";

import * as React from "react";

import { useCompanyStore } from "@/entities/company/model/store";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import { toDocumentData, type InvoiceDocumentData } from "@/entities/invoice/model/document";
import { detailedSample, referenceSample } from "@/entities/invoice/model/samples";
import type { TemplateConfig } from "@/entities/template/model/schema";

export type PreviewSource = "sample-short" | "sample-detailed" | (string & {});

/**
 * What the template editor previews. Samples take the template's default terms,
 * so editing that text shows up immediately; a real invoice keeps its own text.
 */
export function usePreviewData(source: PreviewSource, config: TemplateConfig): InvoiceDocumentData {
  const company = useCompanyStore((state) => state.profile);
  const invoices = useInvoicesStore((state) => state.invoices);
  const { terms, statement } = config.content;

  return React.useMemo(() => {
    const invoice = invoices.find((item) => item.id === source);
    if (invoice) return toDocumentData(invoice, company);

    const sample = source === "sample-short" ? referenceSample(company) : detailedSample(company);
    return { ...sample, terms, statement };
  }, [source, invoices, company, terms, statement]);
}

export function usePreviewOptions() {
  const invoices = useInvoicesStore((state) => state.invoices);
  return React.useMemo(
    () =>
      [...invoices]
        .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
        .slice(0, 8)
        .map((invoice) => ({
          value: invoice.id,
          label: `${invoice.number} · ${invoice.customer.name}`,
        })),
    [invoices],
  );
}
