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

const AUTOSAVE_DELAY_MS = 700;

/** Autosave progress, for the status line. */
export type SaveState = "idle" | "saving" | "saved" | "invalid";

const invoiceRoute = (id: string) => `/invoices/${id}`;

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

/** A paid invoice that owes money again (lines added, payment lowered) is open again. */
function reopenIfOwed(input: InvoiceInput): { input: InvoiceInput; reopened: boolean } {
  const reopened = input.status === "paid" && computeTotals(input).balance > 0.005;
  return { input: reopened ? { ...input, status: "sent" } : input, reopened };
}

function successMessage(input: InvoiceInput, record: InvoiceRecord | null) {
  const wasDraft = (record?.status ?? "draft") === "draft";
  if (input.status === "paid" && record?.status !== "paid") {
    return { title: `${input.number} marked as paid` };
  }
  if (input.status === "sent" && wasDraft) {
    return {
      title: `${input.number} marked as sent`,
      description:
        "Email delivery is simulated here. Print or save the PDF to send it yourself.",
    };
  }
  return { title: record ? "Invoice saved" : `${input.number} saved as draft` };
}

type Options = {
  /** Lets the screen reveal the form, e.g. close a preview that covers it. */
  onInvalid: () => void;
  /** Save quietly shortly after every valid change instead of waiting for "Save". */
  autosave?: boolean;
  /** Where an invoice lives on this screen: used after create and duplicate. Keep it stable. */
  routeFor?: (id: string) => string;
  /** Where to go after deleting. */
  homeHref?: string;
};

/**
 * Everything an invoice screen does, without the markup: the form, dirty
 * tracking, saving with status changes (manual or autosave) and smart defaults.
 */
export function useInvoiceEditor(
  existing: InvoiceRecord | null,
  { onInvalid, autosave = false, routeFor = invoiceRoute, homeHref = "/invoices" }: Options,
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
  /** Set on open for existing invoices, and when autosave creates a new one. */
  const [recordId, setRecordId] = React.useState<string | null>(existing?.id ?? null);
  const [saveState, setSaveState] = React.useState<SaveState>(existing ? "saved" : "idle");
  const record = recordId
    ? (invoices.find((invoice) => invoice.id === recordId) ?? null)
    : null;

  const form = useForm<InvoiceInput>({
    defaultValues: initial,
    resolver: zodResolver(invoiceSchema),
    mode: "onTouched",
  });
  // useWatch is typed deep-partial; defaults are complete and fields never unregister.
  const values = useWatch({ control: form.control }) as InvoiceInput;

  const dirty = !deepEqual(saved, values);
  const template = resolveTemplate(templates, values.templateId, defaultTemplateId);
  const totals = computeTotals(values);
  const status = record
    ? displayStatus(record, computeTotals(record).balance, todayIso())
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

  // --- autosave -------------------------------------------------------------------

  React.useEffect(() => {
    if (!autosave || !dirty) return;

    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const valid = await form.trigger();
      const store = useInvoicesStore.getState();
      const raw = structuredClone(form.getValues());

      if (isNumberTaken(store.invoices, raw.number, recordId ?? undefined)) {
        form.setError("number", { message: "Another invoice already uses this number" });
        setSaveState("invalid");
        return;
      }
      if (!valid) {
        setSaveState("invalid");
        return;
      }

      const { input } = reopenIfOwed(raw);
      if (input.status !== raw.status) form.setValue("status", input.status);

      const next = recordId ? store.update(recordId, input) : store.create(input);
      if (!next) {
        setSaveState("invalid");
        return;
      }
      if (!recordId) {
        setRecordId(next.id);
        // Keep the address bar in sync without remounting the screen mid-typing.
        window.history.replaceState(null, "", routeFor(next.id));
      }
      setSaved(input);
      setSaveState("saved");
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [autosave, dirty, values, form, recordId, routeFor]);

  // --- navigation -----------------------------------------------------------------

  const leave = async (href: string) => {
    if (dirty) {
      const confirmed = await requestConfirm({
        title: record ? "Leave without saving?" : "Discard this invoice?",
        description: record
          ? "Your latest changes to this invoice will be lost."
          : "The invoice hasn't been saved yet. Save it as a draft to keep it.",
        confirmLabel: "Discard",
        tone: "danger",
      });
      if (!confirmed) return;
    }
    router.push(href);
  };

  // --- saving ---------------------------------------------------------------------

  const commit = (
    nextStatus: InvoiceStatus | null,
    patch?: (values: InvoiceInput) => Partial<InvoiceInput>,
  ) =>
    form.handleSubmit(
      (formValues) => {
        const store = useInvoicesStore.getState();

        if (isNumberTaken(store.invoices, formValues.number, record?.id)) {
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

        const { input, reopened } = reopenIfOwed({
          ...formValues,
          ...patch?.(formValues),
          status: nextStatus ?? formValues.status,
        });
        const message = reopened
          ? {
              title: `${input.number} is open again`,
              description: "Its balance is no longer zero, so it moved back to Sent.",
            }
          : successMessage(input, record);

        if (record) {
          store.update(record.id, input);
          form.reset(input);
          setSaved(input);
        } else {
          const created = store.create(input);
          setSaved(input);
          setRecordId(created.id);
          router.replace(routeFor(created.id));
        }
        setSaveState("saved");
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
    if (!record) return;
    const confirmed = await requestConfirm({
      title: `Delete ${record.number}?`,
      description: "The invoice disappears from the list. This can't be undone.",
      confirmLabel: "Delete invoice",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaved(values);
    useInvoicesStore.getState().remove(record.id);
    router.push(homeHref);
    toast(`${record.number} deleted`);
  };

  const duplicate = async () => {
    if (!record) return;
    if (dirty) {
      const proceed = await requestConfirm({
        title: "Duplicate the saved version?",
        description: "Unsaved changes on this screen won't be copied.",
        confirmLabel: "Duplicate",
      });
      if (!proceed) return;
    }
    const copy = useInvoicesStore.getState().duplicate(record.id, invoicing.prefix);
    if (!copy) return;
    setSaved(values);
    router.push(routeFor(copy.id));
    toast(`Duplicated as ${copy.number}`, {
      description: "Saved as a draft with today's date.",
    });
  };

  // --- smart defaults -------------------------------------------------------------

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
    /** The saved record, if any. `existing` is kept as an alias for screens written before autosave. */
    record,
    existing: record,
    dirty,
    status,
    saveState,
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
