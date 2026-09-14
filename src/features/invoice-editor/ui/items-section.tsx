"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

import type { InvoiceInput } from "@/entities/invoice/model/schema";
import { cn } from "@/shared/lib/cn";
import { formatMoney, type Currency } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { SectionHeading } from "@/shared/ui/field";
import { Input, Textarea } from "@/shared/ui/input";
import { itemFieldId, newLineItem } from "../lib/line-item";

const iconButton =
  "grid h-7 w-7 place-items-center text-ink-faint transition-colors hover:bg-panel hover:text-ink disabled:pointer-events-none disabled:opacity-30";

/**
 * One card per line: the name gets the full width, the description grows with its
 * text, and quantity / rate / amount sit in one labelled row — the same on a phone
 * and on a desktop, so nothing is hidden behind a header row.
 */
export function ItemsSection({
  form,
  currency,
  lines,
}: {
  form: UseFormReturn<InvoiceInput>;
  currency: Currency;
  lines: number[];
}) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "key",
  });
  const errors = form.formState.errors.items;

  return (
    <section className="space-y-3">
      <SectionHeading
        index="03"
        title="Line items"
        action={
          <span className="tnum text-micro text-ink-faint">
            {fields.length} {fields.length === 1 ? "line" : "lines"}
          </span>
        }
      />

      <ol className="space-y-3">
        {fields.map((field, index) => {
          const lineErrors = errors?.[index];
          const message =
            lineErrors?.name?.message ??
            lineErrors?.quantity?.message ??
            lineErrors?.rate?.message;

          return (
            <li
              key={field.key}
              className={cn(
                "border bg-panel",
                lineErrors ? "border-signal" : "border-rule",
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-rule bg-panel-sunken py-1 pr-1 pl-3">
                <span className="tnum text-micro font-medium tracking-[0.06em] text-ink-soft uppercase">
                  Line {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move line ${index + 1} up`}
                    title="Move up"
                    className={iconButton}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === fields.length - 1}
                    aria-label={`Move line ${index + 1} down`}
                    title="Move down"
                    className={iconButton}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remove line ${index + 1}`}
                    title={
                      fields.length === 1
                        ? "An invoice needs at least one line"
                        : "Remove line"
                    }
                    className={cn(iconButton, "hover:text-signal")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div className="space-y-2">
                  <Input
                    id={itemFieldId(index, "name")}
                    placeholder="What you are billing for"
                    aria-label={`Line ${index + 1}: item`}
                    aria-invalid={Boolean(lineErrors?.name)}
                    className={cn("font-medium", lineErrors?.name && "border-signal")}
                    {...form.register(`items.${index}.name`)}
                  />
                  <Textarea
                    id={itemFieldId(index, "description")}
                    rows={2}
                    placeholder="Description (optional): scope, period, deliverables"
                    aria-label={`Line ${index + 1}: description`}
                    className="min-h-16 resize-none text-[0.8125rem] [field-sizing:content]"
                    {...form.register(`items.${index}.description`)}
                  />
                </div>

                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,1.1fr)] items-end gap-2">
                  <label className="min-w-0 space-y-1">
                    <span className="field-label block">Qty</span>
                    <Input
                      id={itemFieldId(index, "quantity")}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      aria-invalid={Boolean(lineErrors?.quantity)}
                      className={cn(
                        "tnum text-right",
                        lineErrors?.quantity && "border-signal",
                      )}
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </label>

                  <label className="min-w-0 space-y-1">
                    <span className="field-label block">Rate</span>
                    <span className="relative block">
                      <Input
                        id={itemFieldId(index, "rate")}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        aria-invalid={Boolean(lineErrors?.rate)}
                        className={cn(
                          "tnum pr-12 text-right",
                          lineErrors?.rate && "border-signal",
                        )}
                        {...form.register(`items.${index}.rate`, { valueAsNumber: true })}
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-micro text-ink-faint">
                        {currency}
                      </span>
                    </span>
                  </label>

                  <div className="min-w-0 space-y-1 text-right">
                    <span className="field-label block">Amount</span>
                    <p className="tnum flex h-10 items-center justify-end truncate text-sm font-semibold">
                      {formatMoney(lines[index] ?? 0, currency)}
                    </p>
                  </div>
                </div>
              </div>

              {message ? (
                <p
                  role="alert"
                  className="border-t border-signal px-3 py-2 text-micro text-signal"
                >
                  {message}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => append(newLineItem())}
      >
        <Plus className="h-4 w-4" />
        Add line
      </Button>
    </section>
  );
}
