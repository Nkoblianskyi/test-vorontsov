"use client";

import { Controller } from "react-hook-form";

import { Field, SectionHeading, ToggleRow } from "@/shared/ui/field";
import { Input, Textarea } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Segmented } from "@/shared/ui/segmented";

import { useTemplateEditor } from "../model/use-template-editor";
import { currencyValues, dateFormatValues } from "../model/schema";
import type { TemplateConfig } from "../model/schema";

type ToggleName = {
  [K in keyof TemplateConfig["content"]]: TemplateConfig["content"][K] extends boolean
    ? K
    : never;
}[keyof TemplateConfig["content"]];

const columnToggles: { name: ToggleName; label: string; description?: string }[] = [
  { name: "showItemDescription", label: "Item descriptions" },
  { name: "showQuantity", label: "Quantity and unit" },
  { name: "showPurchaseOrder", label: "Purchase order number" },
  { name: "showDueDate", label: "Due date" },
];

const totalsToggles: { name: ToggleName; label: string; description?: string }[] = [
  { name: "showDiscount", label: "Discount line" },
  { name: "showTaxes", label: "Tax lines", description: "VAT and any local levy." },
  {
    name: "showPaymentMade",
    label: "Payments and balance due",
    description: "Hiding this also hides the balance block.",
  },
];

const dateFormatLabels: Record<(typeof dateFormatValues)[number], string> = {
  long: "1 September 2026",
  numeric: "01/09/2026",
  iso: "2026-09-01",
};

export function ContentSection() {
  const { form, config } = useTemplateEditor();

  return (
    <div className="space-y-7">
      <section className="space-y-4">
        <SectionHeading title="Document" />

        <Controller
          control={form.control}
          name="content.documentTitle"
          render={({ field, fieldState }) => (
            <Field
              label="Title"
              hint="Shown on the sheet and in the page footer."
              htmlFor="document-title"
            >
              <Input id="document-title" {...field} />
              {fieldState.error ? (
                <p className="text-micro text-signal">{fieldState.error.message}</p>
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="content.currency"
          render={({ field }) => (
            <Field label="Currency">
              <Segmented
                name="Currency"
                value={field.value}
                onChange={field.onChange}
                options={currencyValues.map((currency) => ({
                  value: currency,
                  label: currency,
                }))}
              />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="content.dateFormat"
          render={({ field }) => (
            <Field label="Date format">
              <Segmented
                name="Date format"
                value={field.value}
                onChange={field.onChange}
                options={dateFormatValues.map((format) => ({
                  value: format,
                  label: dateFormatLabels[format],
                }))}
              />
            </Field>
          )}
        />
      </section>

      <section className="space-y-1">
        <SectionHeading title="Columns and details" />
        <div>
          {columnToggles.map((toggle) => (
            <Controller
              key={toggle.name}
              control={form.control}
              name={`content.${toggle.name}` as const}
              render={({ field }) => (
                <ToggleRow
                  label={toggle.label}
                  description={toggle.description}
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  }
                />
              )}
            />
          ))}
        </div>
      </section>

      <section className="space-y-1">
        <SectionHeading title="Totals" />
        <div>
          {totalsToggles.map((toggle) => (
            <Controller
              key={toggle.name}
              control={form.control}
              name={`content.${toggle.name}` as const}
              render={({ field }) => (
                <ToggleRow
                  label={toggle.label}
                  description={toggle.description}
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  }
                />
              )}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Closing text" />

        <Controller
          control={form.control}
          name="content.showTerms"
          render={({ field }) => (
            <ToggleRow
              label="Terms"
              control={<Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          )}
        />

        {config.content.showTerms ? (
          <Controller
            control={form.control}
            name="content.terms"
            render={({ field }) => (
              <Field
                label="Terms text"
                action={<span className="field-label tnum">{field.value.length}/400</span>}
              >
                <Textarea {...field} maxLength={400} />
              </Field>
            )}
          />
        ) : null}

        <Controller
          control={form.control}
          name="content.showStatement"
          render={({ field }) => (
            <ToggleRow
              label="Closing note"
              control={<Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          )}
        />

        {config.content.showStatement ? (
          <Controller
            control={form.control}
            name="content.statement"
            render={({ field }) => (
              <Field
                label="Note text"
                action={<span className="field-label tnum">{field.value.length}/400</span>}
              >
                <Textarea {...field} maxLength={400} />
              </Field>
            )}
          />
        ) : null}

        <Controller
          control={form.control}
          name="content.showPageFooter"
          render={({ field }) => (
            <ToggleRow
              label="Page footer"
              description="Repeats the invoice number and page count."
              control={<Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          )}
        />
      </section>
    </div>
  );
}
