"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, Controller, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Copy, PenLine, Plus, Printer, Send, Trash2 } from "lucide-react";

import { useCompanyStore, type InvoicingDefaults } from "@/entities/company/model/store";
import { toDocumentData } from "@/entities/invoice/model/document";
import {
  invoiceSchema,
  toInvoiceInput,
  type InvoiceInput,
  type InvoiceRecord,
  type InvoiceStatus,
} from "@/entities/invoice/model/schema";
import { isNumberTaken, nextInvoiceNumber, useInvoicesStore } from "@/entities/invoice/model/store";
import { computeTotals, type InvoiceTotals } from "@/entities/invoice/lib/totals";
import { displayStatus, statusMeta } from "@/entities/invoice/lib/status";
import { InvoiceDocument } from "@/entities/invoice/ui/invoice-document";
import { MobilePreviewBar, MobilePreviewSheet } from "@/entities/invoice/ui/mobile-preview";
import { PreviewStage } from "@/entities/invoice/ui/preview-stage";
import type { TemplateRecord } from "@/entities/template/model/schema";
import { editorHref, resolveTemplate, useTemplatesStore } from "@/entities/template/model/store";
import { addDays, daysBetween, todayIso } from "@/shared/lib/dates";
import { deepEqual } from "@/shared/lib/equal";
import { focusField } from "@/shared/lib/focus-field";
import { createId } from "@/shared/lib/id";
import { cn } from "@/shared/lib/cn";
import {
  currencyNames,
  currencyValues,
  formatMoney,
  formatPercent,
  formatTimestamp,
  type Currency,
} from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { requestConfirm } from "@/shared/ui/confirm";
import { DatePicker } from "@/shared/ui/date-picker";
import { Field, SectionHeading } from "@/shared/ui/field";
import { Input, Textarea } from "@/shared/ui/input";
import { Listbox } from "@/shared/ui/listbox";
import { Segmented } from "@/shared/ui/segmented";
import { toast } from "@/shared/ui/toast";
import { ItemsSection, newLineItem } from "./items-section";
import { PreviewEditPopover, resolveEdit, type InlineTarget } from "./preview-edit";

const PAYMENT_TERMS = [
  { days: 0, label: "On receipt" },
  { days: 7, label: "Net 7" },
  { days: 14, label: "Net 14" },
  { days: 30, label: "Net 30" },
];

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

function countErrors(errors: FieldErrors): number {
  let count = 0;
  for (const [key, value] of Object.entries(errors)) {
    if (!value || key === "ref") continue;
    if (typeof (value as { message?: unknown }).message === "string") count += 1;
    else count += countErrors(value as FieldErrors);
  }
  return count;
}

/* ------------------------------------------------------------------ summary */

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4 py-1", strong && "font-semibold")}>
      <span className={strong ? undefined : "text-ink-soft"}>{label}</span>
      <span className="tnum">{value}</span>
    </div>
  );
}

function Summary({
  totals,
  currency,
  discount,
}: {
  totals: InvoiceTotals;
  currency: Currency;
  discount: InvoiceInput["discount"];
}) {
  const money = (value: number) => formatMoney(value, currency);
  return (
    <div id="summary" className="border border-ink text-sm" aria-live="polite">
      <div className="px-4 py-3">
        <SummaryRow label="Subtotal" value={money(totals.subtotal)} />
        {totals.discount > 0 ? (
          <SummaryRow
            label={discount?.type === "percent" ? `Discount (${formatPercent(discount.value)})` : "Discount"}
            value={`− ${money(totals.discount)}`}
          />
        ) : null}
        {totals.taxes.map((tax, index) => (
          <SummaryRow
            key={index}
            label={`${tax.name || "Tax"} (${formatPercent(tax.rate)})`}
            value={money(tax.amount)}
          />
        ))}
        <div className="mt-1 border-t border-rule pt-1">
          <SummaryRow label="Total" value={money(totals.total)} strong />
        </div>
        {totals.paid > 0 ? <SummaryRow label="Paid" value={`− ${money(totals.paid)}`} /> : null}
      </div>
      <div className="flex items-baseline justify-between gap-4 bg-ink px-4 py-3 text-panel">
        <span className="text-micro uppercase tracking-[0.08em] text-panel/70">Balance due</span>
        <span className="tnum text-xl font-semibold tracking-tight">{money(totals.balance)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ form */

function InvoiceEditorForm({ existing }: { existing: InvoiceRecord | null }) {
  const router = useRouter();
  const invoices = useInvoicesStore((state) => state.invoices);
  const templates = useTemplatesStore((state) => state.templates);
  const defaultTemplateId = useTemplatesStore((state) => state.defaultId);
  const editorPreference = useTemplatesStore((state) => state.editorPreference);
  const company = useCompanyStore((state) => state.profile);
  const invoicing = useCompanyStore((state) => state.invoicing);

  const [initial] = React.useState<InvoiceInput>(() =>
    existing
      ? toInvoiceInput(existing)
      : blankInvoice(invoices, invoicing, resolveTemplate(templates, defaultTemplateId, defaultTemplateId)),
  );
  const [saved, setSaved] = React.useState(initial);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [inline, setInline] = React.useState<InlineTarget | null>(null);

  const form = useForm<InvoiceInput>({
    defaultValues: initial,
    resolver: zodResolver(invoiceSchema),
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const values = useWatch({ control: form.control }) as InvoiceInput;
  const taxes = useFieldArray({ control: form.control, name: "taxes", keyName: "key" });

  const dirty = !deepEqual(saved, values);
  const template = resolveTemplate(templates, values.templateId, defaultTemplateId);
  const totals = computeTotals(values);
  const data = React.useMemo(
    () => toDocumentData(values, company, { placeholders: true }),
    [values, company],
  );

  const today = todayIso();
  const status = existing
    ? displayStatus(existing, computeTotals(existing).balance, today)
    : null;

  const customers = React.useMemo(() => {
    const seen = new Map<string, InvoiceInput["customer"]>();
    for (const invoice of [...invoices].sort((a, b) => b.issueDate.localeCompare(a.issueDate))) {
      const key = invoice.customer.name.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, invoice.customer);
    }
    return [...seen.values()].slice(0, 5);
  }, [invoices]);

  // --- leave guard ------------------------------------------------------------
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

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

  // --- preview: open, click-to-edit --------------------------------------------
  const closePreview = React.useCallback(() => {
    setPreviewOpen(false);
    setInline(null);
  }, []);

  const showInForm = (fieldId: string, openPicker = false) => {
    const delay = previewOpen ? 220 : 0;
    setInline(null);
    setPreviewOpen(false);
    window.setTimeout(() => focusField(fieldId, { click: openPicker }), delay);
  };

  const onPick = (key: string, anchor: HTMLElement) => {
    const spec = resolveEdit(key, values.currency);
    if (!spec) return;

    if (spec.kind === "field") {
      setInline({ spec, anchor });
      return;
    }
    if (spec.kind === "jump") {
      showInForm(spec.fieldId, spec.openPicker);
      return;
    }

    void (async () => {
      const confirmed =
        spec.kind === "company"
          ? await requestConfirm({
              title: "Company details live in Settings",
              description:
                "Your name and address print on every invoice, so they are edited once, in Settings.",
              confirmLabel: "Open Settings",
            })
          : await requestConfirm({
              title: `${spec.label} comes from the template`,
              description: `It is part of “${template.name}”. Changing it there updates every invoice that uses the template.`,
              confirmLabel: "Customize template",
            });
      if (!confirmed) return;
      closePreview();
      void leave(spec.kind === "company" ? "/settings" : editorHref(template.id, editorPreference));
    })();
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
          closePreview();
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

        const input: InvoiceInput = {
          ...formValues,
          ...patch?.(formValues),
          status: nextStatus ?? formValues.status,
        };

        const message =
          input.status === "paid" && existing?.status !== "paid"
            ? `${input.number} marked as paid`
            : input.status === "sent" && (existing?.status ?? "draft") === "draft"
              ? `${input.number} marked as sent`
              : existing
                ? "Invoice saved"
                : `${input.number} saved as draft`;
        const description =
          input.status === "sent" && (existing?.status ?? "draft") === "draft"
            ? "Email delivery is simulated here. Print or save the PDF to send it yourself."
            : undefined;

        if (existing) {
          store.update(existing.id, input);
          form.reset(input);
          setSaved(input);
        } else {
          const record = store.create(input);
          setSaved(input);
          router.replace(`/invoices/${record.id}`);
        }
        toast(message, { tone: "positive", description });
      },
      (formErrors) => {
        closePreview();
        const count = countErrors(formErrors);
        toast("Check the highlighted fields", {
          tone: "danger",
          description: `${count} ${count === 1 ? "field needs" : "fields need"} attention before saving.`,
        });
      },
    )();

  const markPaid = () => commit("paid", (formValues) => ({ amountPaid: computeTotals(formValues).total }));

  const onDelete = async () => {
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

  const onDuplicate = async () => {
    if (!existing) return;
    if (dirty) {
      const proceed = await requestConfirm({
        title: "Duplicate the saved version?",
        description: "Unsaved changes on this screen won't be copied.",
        confirmLabel: "Duplicate",
      });
      if (!proceed) return;
    }
    const store = useInvoicesStore.getState();
    const issueDate = todayIso();
    const copy = store.duplicate(existing.id, {
      number: nextInvoiceNumber(store.invoices, invoicing.prefix),
      issueDate,
      dueDate: addDays(issueDate, Math.max(0, daysBetween(existing.issueDate, existing.dueDate))),
    });
    if (!copy) return;
    setSaved(values);
    router.push(`/invoices/${copy.id}`);
    toast(`Duplicated as ${copy.number}`, { description: "Saved as a draft with today's date." });
  };

  // --- smart defaults -----------------------------------------------------------
  const onTemplateChange = (nextId: string) => {
    const previous = resolveTemplate(templates, form.getValues("templateId"), defaultTemplateId);
    const next = templates.find((item) => item.id === nextId);
    form.setValue("templateId", nextId, { shouldDirty: true });
    if (!next) return;
    // Text still equal to the old template's default follows the new template.
    if (form.getValues("terms") === previous.content.terms) form.setValue("terms", next.content.terms);
    if (form.getValues("statement") === previous.content.statement) {
      form.setValue("statement", next.content.statement);
    }
  };

  const setTerms = (days: number) =>
    form.setValue("dueDate", addDays(form.getValues("issueDate") || todayIso(), days), {
      shouldValidate: true,
      shouldDirty: true,
    });

  const setIssueDate = (iso: string) => {
    form.setValue("issueDate", iso, { shouldValidate: true, shouldDirty: true });
    void form.trigger("dueDate");
  };

  const dueDatePresets = PAYMENT_TERMS.map((term) => ({
    label: term.label,
    value: () => addDays(form.getValues("issueDate") || todayIso(), term.days),
  }));

  const activeTerms =
    values.issueDate && values.dueDate ? daysBetween(values.issueDate, values.dueDate) : null;

  const fillCustomer = (customer: InvoiceInput["customer"]) => {
    form.setValue("customer", { ...customer }, { shouldValidate: true });
  };

  const title = existing ? existing.number : "New invoice";
  const saveLabel = existing ? "Save" : "Save draft";
  const sheet = <InvoiceDocument config={template} data={data} />;
  const previewCaption = (
    <p className="truncate text-micro text-ink-soft">
      <span className="font-medium text-ink">{template.name}</span>
      <span className="hidden sm:inline"> · click anything on the sheet to edit it</span>
    </p>
  );

  return (
    <div data-print="shell" className="flex h-dvh flex-col overflow-clip">
      {/* ------------------------------------------------------------ top bar */}
      <header
        data-print="hide"
        className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-rule-strong bg-panel px-2 sm:px-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => leave("/invoices")} aria-label="Back to invoices">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="tnum truncate text-sm font-semibold tracking-tight">{title}</h1>
              {status ? <Badge tone={statusMeta[status].tone}>{statusMeta[status].label}</Badge> : null}
            </div>
            <p role="status" className="truncate text-micro text-ink-faint">
              {dirty ? (
                <span className="text-signal">{existing ? "Unsaved changes" : "Not saved yet"}</span>
              ) : existing ? (
                `Saved ${formatTimestamp(existing.updatedAt)}`
              ) : (
                "Draft"
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {existing ? (
            <div className="hidden border border-rule sm:flex">
              <Button variant="ghost" size="icon" onClick={onDuplicate} aria-label="Duplicate invoice" title="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Delete invoice"
                title="Delete"
                className="border-l border-rule hover:text-signal"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
          <Button size="sm" variant="ghost" className="hidden md:inline-flex" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>

          <Button
            size="sm"
            variant={existing && existing.status !== "draft" ? "solid" : "outline"}
            onClick={() => commit(null)}
            disabled={Boolean(existing) && !dirty}
            className={cn(existing && existing.status !== "draft" && !dirty && "hidden sm:inline-flex")}
          >
            {saveLabel}
          </Button>

          {!existing || existing.status === "draft" ? (
            <Button size="sm" variant="solid" onClick={() => commit("sent")}>
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{existing ? "Mark as sent" : "Save & mark sent"}</span>
              <span className="sm:hidden">Send</span>
            </Button>
          ) : status && status !== "paid" && status !== "void" ? (
            <Button size="sm" variant="solid" onClick={markPaid}>
              <Check className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark as paid</span>
              <span className="sm:hidden">Paid</span>
            </Button>
          ) : null}
        </div>
      </header>

      <div data-print="shell" className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ---------------------------------------------------------- form */}
        <form
          data-print="hide"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void commit(null);
          }}
          className="min-h-0 w-full flex-1 overflow-y-auto bg-panel lg:w-[500px] lg:flex-none lg:border-r lg:border-rule-strong xl:w-[540px]"
        >
          <div className="space-y-9 px-4 pt-6 pb-28 sm:px-6 lg:pb-8">
            {/* 01 customer */}
            <section className="space-y-4">
              <SectionHeading index="01" title="Customer" />

              {!values.customer?.name && customers.length ? (
                <div className="space-y-1.5">
                  <p className="field-label">Recent customers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {customers.map((customer) => (
                      <button
                        key={customer.name}
                        type="button"
                        onClick={() => fillCustomer(customer)}
                        className="border border-rule px-2 py-1 text-[0.8125rem] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                      >
                        {customer.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <Field label="Customer name" htmlFor="customer-name" required error={errors.customer?.name?.message}>
                <Input
                  id="customer-name"
                  autoComplete="organization"
                  aria-invalid={Boolean(errors.customer?.name)}
                  {...form.register("customer.name")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="customer-email" error={errors.customer?.email?.message}>
                  <Input
                    id="customer-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.customer?.email)}
                    {...form.register("customer.email")}
                  />
                </Field>
                <Field label="Tax ID" htmlFor="customer-tax" error={errors.customer?.taxId?.message}>
                  <Input id="customer-tax" {...form.register("customer.taxId")} />
                </Field>
              </div>
              <Field
                label="Billing address"
                htmlFor="customer-address"
                hint="One line per row, as it should print."
                error={errors.customer?.address?.message}
              >
                <Textarea
                  id="customer-address"
                  rows={3}
                  className="[field-sizing:content]"
                  {...form.register("customer.address")}
                />
              </Field>
            </section>

            {/* 02 details */}
            <section className="space-y-4">
              <SectionHeading index="02" title="Details" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Invoice number" htmlFor="invoice-number" required error={errors.number?.message}>
                  <Input
                    id="invoice-number"
                    className="tnum"
                    aria-invalid={Boolean(errors.number)}
                    {...form.register("number")}
                  />
                </Field>
                <Field label="Reference / PO" htmlFor="invoice-reference" error={errors.reference?.message}>
                  <Input id="invoice-reference" placeholder="Optional" {...form.register("reference")} />
                </Field>
                <Controller
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <Field
                      label="Issue date"
                      htmlFor="issue-date"
                      error={errors.issueDate?.message}
                      action={
                        <button
                          type="button"
                          onClick={() => setIssueDate(todayIso())}
                          disabled={field.value === todayIso()}
                          className="text-micro text-ink-soft underline-offset-2 hover:text-ink hover:underline disabled:no-underline disabled:opacity-40"
                        >
                          Today
                        </button>
                      }
                    >
                      <DatePicker
                        id="issue-date"
                        value={field.value}
                        onChange={setIssueDate}
                        onBlur={field.onBlur}
                        invalid={Boolean(errors.issueDate)}
                      />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <Field label="Due date" htmlFor="due-date" error={errors.dueDate?.message}>
                      <DatePicker
                        id="due-date"
                        value={field.value}
                        min={values.issueDate}
                        presets={dueDatePresets}
                        onChange={(iso) =>
                          form.setValue("dueDate", iso, { shouldValidate: true, shouldDirty: true })
                        }
                        onBlur={field.onBlur}
                        invalid={Boolean(errors.dueDate)}
                      />
                    </Field>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Payment terms">
                {PAYMENT_TERMS.map((term) => (
                  <button
                    key={term.days}
                    type="button"
                    onClick={() => setTerms(term.days)}
                    aria-pressed={activeTerms === term.days}
                    className={cn(
                      "border px-2 py-1 text-[0.8125rem] transition-colors",
                      activeTerms === term.days
                        ? "border-ink bg-ink text-panel"
                        : "border-rule text-ink-soft hover:border-ink hover:text-ink",
                    )}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <Field label="Currency" htmlFor="currency">
                      <Listbox
                        id="currency"
                        value={field.value}
                        onChange={field.onChange}
                        options={currencyValues.map((currency) => ({
                          value: currency,
                          label: `${currency} · ${currencyNames[currency]}`,
                        }))}
                      />
                    </Field>
                  )}
                />
                <Field
                  label="Template"
                  htmlFor="template"
                  action={
                    <button
                      type="button"
                      onClick={() => leave(editorHref(template.id, editorPreference))}
                      className="inline-flex items-center gap-1 text-micro text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                    >
                      <PenLine className="h-3 w-3" />
                      Customize
                    </button>
                  }
                >
                  <Listbox
                    id="template"
                    value={template.id}
                    onChange={onTemplateChange}
                    options={templates.map((item) => ({
                      value: item.id,
                      label: item.name,
                      swatch: item.primaryColor,
                      description: item.id === defaultTemplateId ? "Default" : undefined,
                    }))}
                  />
                </Field>
              </div>
            </section>

            {/* 03 items */}
            <ItemsSection form={form} currency={values.currency} lines={totals.lines} />

            {/* 04 adjustments */}
            <section className="space-y-4">
              <SectionHeading index="04" title="Discount, tax and payments" />
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <Field label="Discount" htmlFor="discount-value" error={errors.discount?.value?.message}>
                  <Input
                    id="discount-value"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    className="tnum"
                    aria-invalid={Boolean(errors.discount?.value)}
                    {...form.register("discount.value", { valueAsNumber: true })}
                  />
                </Field>
                <Controller
                  control={form.control}
                  name="discount.type"
                  render={({ field }) => (
                    <Field label="Type">
                      <Segmented
                        name="Discount type"
                        value={field.value}
                        onChange={(next) => {
                          field.onChange(next);
                          void form.trigger("discount.value");
                        }}
                        className="h-10"
                        options={[
                          { value: "percent", label: "%" },
                          { value: "amount", label: values.currency },
                        ]}
                      />
                    </Field>
                  )}
                />
              </div>

              <div className="space-y-2">
                <p className="field-label">Taxes</p>
                {taxes.fields.length ? (
                  <ul className="space-y-2">
                    {taxes.fields.map((tax, index) => {
                      const taxErrors = errors.taxes?.[index];
                      return (
                        <li key={tax.key} className="space-y-1">
                          <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_2.25rem] gap-2">
                            <Input
                              id={`tax-${index}-name`}
                              placeholder="Tax name, e.g. VAT"
                              aria-label={`Tax ${index + 1} name`}
                              aria-invalid={Boolean(taxErrors?.name)}
                              {...form.register(`taxes.${index}.name`)}
                            />
                            <div className="relative">
                              <Input
                                id={`tax-${index}-rate`}
                                type="number"
                                inputMode="decimal"
                                step="any"
                                min="0"
                                max="100"
                                aria-label={`Tax ${index + 1} rate, percent`}
                                aria-invalid={Boolean(taxErrors?.rate)}
                                className="tnum pr-7 text-right"
                                {...form.register(`taxes.${index}.rate`, { valueAsNumber: true })}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-micro text-ink-faint">
                                %
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => taxes.remove(index)}
                              aria-label={`Remove tax ${index + 1}`}
                              className="grid place-items-center border border-rule text-ink-faint hover:border-ink hover:text-signal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {taxErrors?.name?.message || taxErrors?.rate?.message ? (
                            <p role="alert" className="text-micro text-signal">
                              {taxErrors?.name?.message ?? taxErrors?.rate?.message}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-micro text-ink-faint">No taxes on this invoice.</p>
                )}
                {taxes.fields.length < 5 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => taxes.append({ id: createId("tx_"), name: "", rate: 0 })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add tax
                  </Button>
                ) : null}
              </div>

              <Field
                label="Already paid"
                htmlFor="amount-paid"
                hint="Deposits or part payments. The rest prints as balance due."
                error={errors.amountPaid?.message}
              >
                <Input
                  id="amount-paid"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className="tnum"
                  aria-invalid={Boolean(errors.amountPaid)}
                  {...form.register("amountPaid", { valueAsNumber: true })}
                />
              </Field>

              <Summary totals={totals} currency={values.currency} discount={values.discount} />
            </section>

            {/* 05 notes */}
            <section className="space-y-4">
              <SectionHeading
                index="05"
                title="Notes"
                action={
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("terms", template.content.terms, { shouldDirty: true });
                      form.setValue("statement", template.content.statement, { shouldDirty: true });
                    }}
                    className="text-micro text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                  >
                    Use template text
                  </button>
                }
              />
              <Field
                label="Terms & conditions"
                htmlFor="terms"
                error={errors.terms?.message}
                action={<span className="field-label tnum">{values.terms?.length ?? 0}/600</span>}
              >
                <Textarea
                  id="terms"
                  rows={3}
                  maxLength={600}
                  className="[field-sizing:content]"
                  {...form.register("terms")}
                />
              </Field>
              <Field
                label="Statement"
                htmlFor="statement"
                error={errors.statement?.message}
                action={<span className="field-label tnum">{values.statement?.length ?? 0}/600</span>}
              >
                <Textarea
                  id="statement"
                  rows={2}
                  maxLength={600}
                  className="[field-sizing:content]"
                  {...form.register("statement")}
                />
              </Field>
            </section>
          </div>
        </form>

        {/* ---------------------------------------------------------- preview */}
        <PreviewStage className="hidden lg:flex" toolbar={previewCaption} onPick={onPick}>
          {sheet}
        </PreviewStage>
      </div>

      <MobilePreviewBar onOpen={() => setPreviewOpen(true)}>
        <p className="field-label">Balance due</p>
        <p className="tnum truncate text-base font-semibold tracking-tight">
          {formatMoney(totals.balance, values.currency)}
        </p>
      </MobilePreviewBar>

      <MobilePreviewSheet
        open={previewOpen}
        onClose={closePreview}
        title={
          <>
            <p className="tnum truncate text-sm font-semibold">{values.number || title}</p>
            <p className="truncate text-micro text-ink-faint">Tap anything on the sheet to edit it</p>
          </>
        }
      >
        <PreviewStage toolbar={previewCaption} onPick={onPick}>
          {sheet}
        </PreviewStage>
      </MobilePreviewSheet>

      <PreviewEditPopover
        target={inline}
        form={form}
        onClose={() => setInline(null)}
        onShowInForm={(fieldId) => showInForm(fieldId)}
      />
    </div>
  );
}

function InvoiceNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-8">
      <div className="max-w-sm space-y-3 border-t-2 border-ink pt-4">
        <h1 className="text-xl font-semibold tracking-tight">Invoice not found</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          It was deleted, or the link points to an invoice that never existed.
        </p>
        <Link
          href="/invoices"
          className="inline-flex h-10 items-center border border-ink bg-ink px-4 text-sm font-medium text-panel"
        >
          Back to invoices
        </Link>
      </div>
    </main>
  );
}

/** The generator: a form on the left, the real sheet on the right, both always in sync. */
export function InvoiceEditor({ invoiceId }: { invoiceId?: string }) {
  const existing = useInvoicesStore((state) =>
    invoiceId ? state.invoices.find((invoice) => invoice.id === invoiceId) : undefined,
  );

  if (invoiceId && !existing) return <InvoiceNotFound />;

  return <InvoiceEditorForm key={invoiceId ?? "new"} existing={existing ?? null} />;
}
