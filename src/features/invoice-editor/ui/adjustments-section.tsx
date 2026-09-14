"use client";

import { Controller, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { createId } from "@/shared/lib/id";
import { Button } from "@/shared/ui/button";
import { Field, SectionHeading } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Segmented } from "@/shared/ui/segmented";
import type { InvoiceEditorApi } from "../model/use-invoice-editor";
import { Summary } from "./summary";

const MAX_TAXES = 5;

export function AdjustmentsSection({ editor }: { editor: InvoiceEditorApi }) {
  const { form, values, totals } = editor;
  const { errors } = form.formState;
  const taxes = useFieldArray({ control: form.control, name: "taxes", keyName: "key" });

  return (
    <section className="space-y-4">
      <SectionHeading index="04" title="Discount, tax and payments" />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <Field
          label="Discount"
          htmlFor="discount-value"
          error={errors.discount?.value?.message}
        >
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
              const message = taxErrors?.name?.message ?? taxErrors?.rate?.message;
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
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-micro text-ink-faint">
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
                  {message ? (
                    <p role="alert" className="text-micro text-signal">
                      {message}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-micro text-ink-faint">No taxes on this invoice.</p>
        )}
        {taxes.fields.length < MAX_TAXES ? (
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
  );
}
