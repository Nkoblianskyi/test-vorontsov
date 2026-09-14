"use client";

import { Controller } from "react-hook-form";
import { PenLine } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { todayIso } from "@/shared/lib/dates";
import { currencyNames, currencyValues } from "@/shared/lib/format";
import { DatePicker } from "@/shared/ui/date-picker";
import { Field, SectionHeading } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Listbox } from "@/shared/ui/listbox";
import { PAYMENT_TERMS, type InvoiceEditorApi } from "../model/use-invoice-editor";

const linkButton =
  "inline-flex items-center gap-1 text-micro text-ink-soft underline-offset-2 hover:text-ink hover:underline disabled:no-underline disabled:opacity-40";

export function DetailsSection({ editor }: { editor: InvoiceEditorApi }) {
  const {
    form,
    values,
    template,
    templates,
    defaultTemplateId,
    templateEditorHref,
    activeTerms,
    leave,
    changeTemplate,
    setIssueDate,
    setDueDate,
    dueInDays,
  } = editor;
  const { errors } = form.formState;
  const duePresets = PAYMENT_TERMS.map((term) => ({
    label: term.label,
    value: () => dueInDays(term.days),
  }));

  return (
    <section className="space-y-4">
      <SectionHeading index="02" title="Details" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Invoice number"
          htmlFor="invoice-number"
          required
          error={errors.number?.message}
        >
          <Input
            id="invoice-number"
            className="tnum"
            aria-invalid={Boolean(errors.number)}
            {...form.register("number")}
          />
        </Field>
        <Field
          label="Reference / PO"
          htmlFor="invoice-reference"
          error={errors.reference?.message}
        >
          <Input
            id="invoice-reference"
            placeholder="Optional"
            {...form.register("reference")}
          />
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
                  className={linkButton}
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
                presets={duePresets}
                onChange={setDueDate}
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
            onClick={() => setDueDate(dueInDays(term.days))}
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
              onClick={() => leave(templateEditorHref)}
              className={linkButton}
            >
              <PenLine className="h-3 w-3" />
              Customize
            </button>
          }
        >
          <Listbox
            id="template"
            value={template.id}
            onChange={changeTemplate}
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
  );
}
