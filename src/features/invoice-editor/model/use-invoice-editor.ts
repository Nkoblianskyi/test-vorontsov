"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCompanyStore, type InvoicingDefaults } from "@/entities/company/model/store";
import { displayStatus } from "@/entities/invoice/lib/status";
import { computeTotals } from "@/entities/invoice/lib/totals";
import {
  invoiceSchema,
  toInvoiceInput,
  type InvoiceInput,
  type InvoiceRecord,
  type InvoiceStatus,
} from "@/entities/invoice/model/schema";
import {
  isNumberTaken,
  nextInvoiceNumber,
  useInvoicesStore,
} from "@/entities/invoice/model/store";
import type { TemplateRecord } from "@/entities/template/model/schema";
import {
  editorHref,
  resolveTemplate,
  useTemplatesStore,
} from "@/entities/template/model/store";
import { addDays, daysBetween, todayIso } from "@/shared/lib/dates";
import { deepEqual } from "@/shared/lib/equal";
import { countErrors } from "@/shared/lib/form-errors";
import { useUnsavedChangesGuard } from "@/shared/lib/use-unsaved-changes";
import { requestConfirm } from "@/shared/ui/confirm";
import { toast } from "@/shared/ui/toast";
import { newLineItem } from "../lib/line-item";

export const PAYMENT_TERMS = [
  { days: 0, label: "On receipt" },
  { days: 7, label: "Net 7" },
  { days: 14, label: "Net 14" },
  { days: 30, label: "Net 30" },
] as const;

function blankInvoice(
  invoices: InvoiceRecord[],
  invoicing: InvoicingDefaults,
  template: TemplateRecord,
): InvoiceInput {
  const today = todayIso();
  return {
    number: nextInvoiceNumber(invoices, invoicing.prefix),
    status: "draft",
    templateId: template.id,
    currency: invoicing.currency,
    issueDate: today,
    dueDate: addDays(today, invoicing.paymentTermsDays),
    reference: "",
    customer: { name: "", email: "", address: "", taxId: "" },
    items: [newLineItem()],
    discount: { type: "percent", value: 0 },
    taxes: [],
    amountPaid: 0,
    terms: template.content.terms,
    statement: template.content.statement,
  };
}

function successMessage(input: InvoiceInput, existing: InvoiceRecord | null) {
  const wasDraft = (existing?.status ?? "draft") === "draft";
  if (input.status === "paid" && existing?.status !== "paid") {
    return { title: `${input.number} marked as paid` };
  }
  if (input.status === "sent" && wasDraft) {
    return {
      title: `${input.number} marked as sent`,
      description:
        "Email delivery is simulated here. Print or save the PDF to send it yourself.",
    };
  }
  return { title: existing ? "Invoice saved" : `${input.number} saved as draft` };
}

/**
 * Everything the invoice screen does, without the markup: the form, dirty
 * tracking, saving with status changes, and the small smart defaults.
 * `onInvalid` lets the screen reveal the form (e.g. close the mobile preview).
 */
export function useInvoiceEditor(
  existing: InvoiceRecord | null,
  { onInvalid }: { onInvalid: () => void },
) {
  const router = useRouter();
  const invoices = useInvoicesStore((state) => state.invoices);
  const templates = useTemplatesStore((state) => state.templates);
  const defaultTemplateId = useTemplatesStore((state) => state.defaultId);
  const editorPreference = useTemplatesStore((state) => state.editorPreference);
  const invoicing = useCompanyStore((state) => state.invoicing);

  const [initial] = React.useState<InvoiceInput>(() =>
    existing
      ? toInvoiceInput(existing)
      : blankInvoice(
          invoices,
          invoicing,
          resolveTemplate(templates, defaultTemplateId, defaultTemplateId),
        ),
  );
  const [saved, setSaved] = React.useState(initial);

  const form = useForm<InvoiceInput>({
    defaultValues: initial,
    resolver: zodResolver(invoiceSchema),
    mode: "onTouched",
  });
  const values = useWatch({ control: form.control }) as InvoiceInput;

  const dirty = !deepEqual(saved, values);
  const template = resolveTemplate(templates, values.templateId, defaultTemplateId);
  const totals = computeTotals(values);
  const status = existing
    ? displayStatus(existing, computeTotals(existing).balance, todayIso())
    : null;

  useUnsavedChangesGuard(dirty);

  /** Latest customer per name, newest first: one click fills the customer block. */
  const customers = React.useMemo(() => {
    const seen = new Map<string, InvoiceInput["customer"]>();
    for (const invoice of [...invoices].sort((a, b) =>
      b.issueDate.localeCompare(a.issueDate),
    )) {
      const key = invoice.customer.name.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, invoice.customer);
    }
    return [...seen.values()].slice(0, 5);
  }, [invoices]);

  const leave = async (href: string) => {
    if (dirty) {
      const confirmed = await requestConfirm({
        title: existing ? "Leave without saving?" : "Discard this invoice?",
        description: existing
          ? "Your changes to this invoice will be lost."
          : "The invoice hasn't been saved yet. Save it as a draft to keep it.",
        confirmLabel: "Discard",
        tone: "danger",
      });
      if (!confirmed) return;
    }
    router.push(href);
  };

  // --- saving -------------------------------------------------------------------

  const commit = (
    nextStatus: InvoiceStatus | null,
    patch?: (values: InvoiceInput) => Partial<InvoiceInput>,
  ) =>
    form.handleSubmit(
      (formValues) => {
        const store = useInvoicesStore.getState();

        if (isNumberTaken(store.invoices, formValues.number, existing?.id)) {
          onInvalid();
          form.setError(
            "number",
            { type: "validate", message: "Another invoice already uses this number" },
            { shouldFocus: true },
          );
          toast("Invoice number is taken", {
            tone: "danger",
            description: `${formValues.number} already belongs to another invoice.`,
          });
          return;
        }

        let input: InvoiceInput = {
          ...formValues,
          ...patch?.(formValues),
          status: nextStatus ?? formValues.status,
        };
        // A paid invoice that owes money again (lines added, payment lowered) is open again.
        const reopened = input.status === "paid" && computeTotals(input).balance > 0.005;
        if (reopened) input = { ...input, status: "sent" };
        const message = reopened
          ? {
              title: `${input.number} is open again`,
              description: "Its balance is no longer zero, so it moved back to Sent.",
            }
          : successMessage(input, existing);

        if (existing) {
          store.update(existing.id, input);
          form.reset(input);
          setSaved(input);
        } else {
          const record = store.create(input);
          setSaved(input);
          router.replace(`/invoices/${record.id}`);
        }
        toast(message.title, { tone: "positive", description: message.description });
      },
      (formErrors) => {
        onInvalid();
        const count = countErrors(formErrors);
        toast("Check the highlighted fields", {
          tone: "danger",
          description: `${count} ${count === 1 ? "field needs" : "fields need"} attention before saving.`,
        });
      },
    )();

  const markPaid = () =>
    commit("paid", (formValues) => ({ amountPaid: computeTotals(formValues).total }));

  const remove = async () => {
    if (!existing) return;
    const confirmed = await requestConfirm({
      title: `Delete ${existing.number}?`,
      description: "The invoice disappears from the list. This can't be undone.",
      confirmLabel: "Delete invoice",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaved(values);
    useInvoicesStore.getState().remove(existing.id);
    router.push("/invoices");
    toast(`${existing.number} deleted`);
  };

  const duplicate = async () => {
    if (!existing) return;
    if (dirty) {
      const proceed = await requestConfirm({
        title: "Duplicate the saved version?",
        description: "Unsaved changes on this screen won't be copied.",
        confirmLabel: "Duplicate",
      });
      if (!proceed) return;
    }
    const copy = useInvoicesStore.getState().duplicate(existing.id, invoicing.prefix);
    if (!copy) return;
    setSaved(values);
    router.push(`/invoices/${copy.id}`);
    toast(`Duplicated as ${copy.number}`, {
      description: "Saved as a draft with today's date.",
    });
  };

  // --- smart defaults -----------------------------------------------------------

  const changeTemplate = (nextId: string) => {
    const previous = resolveTemplate(
      templates,
      form.getValues("templateId"),
      defaultTemplateId,
    );
    const next = templates.find((item) => item.id === nextId);
    form.setValue("templateId", nextId, { shouldDirty: true });
    if (!next) return;
    // Text still equal to the old template's default follows the new template.
    if (form.getValues("terms") === previous.content.terms) {
      form.setValue("terms", next.content.terms);
    }
    if (form.getValues("statement") === previous.content.statement) {
      form.setValue("statement", next.content.statement);
    }
  };

  const applyTemplateText = () => {
    form.setValue("terms", template.content.terms, { shouldDirty: true });
    form.setValue("statement", template.content.statement, { shouldDirty: true });
  };

  const setIssueDate = (iso: string) => {
    form.setValue("issueDate", iso, { shouldValidate: true, shouldDirty: true });
    void form.trigger("dueDate");
  };

  const setDueDate = (iso: string) =>
    form.setValue("dueDate", iso, { shouldValidate: true, shouldDirty: true });

  const dueInDays = (days: number) =>
    addDays(form.getValues("issueDate") || todayIso(), days);

  const fillCustomer = (customer: InvoiceInput["customer"]) =>
    form.setValue("customer", { ...customer }, { shouldValidate: true });

  return {
    form,
    values,
    existing,
    dirty,
    status,
    totals,
    customers,
    template,
    templates,
    defaultTemplateId,
    templateEditorHref: editorHref(template.id, editorPreference),
    activeTerms:
      values.issueDate && values.dueDate
        ? daysBetween(values.issueDate, values.dueDate)
        : null,
    leave,
    commit,
    markPaid,
    remove,
    duplicate,
    changeTemplate,
    applyTemplateText,
    setIssueDate,
    setDueDate,
    dueInDays,
    fillCustomer,
  };
}

export type InvoiceEditorApi = ReturnType<typeof useInvoiceEditor>;
