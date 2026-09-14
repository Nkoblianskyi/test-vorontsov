"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X } from "lucide-react";
import { useWatch, type Path, type UseFormReturn } from "react-hook-form";

import type { InvoiceInput } from "@/entities/invoice/model/schema";
import { Button } from "@/shared/ui/button";
import { Input, Textarea } from "@/shared/ui/input";
import { floatingStyle, useDismiss, useFloating } from "@/shared/ui/floating";
import { itemFieldId } from "./items-section";

type FieldSpec = {
  kind: "field";
  label: string;
  path: Path<InvoiceInput>;
  input: "text" | "textarea" | "number";
  fieldId: string;
  suffix?: string;
};

/** What a click on the sheet means in the invoice editor. */
export type EditSpec =
  | FieldSpec
  /** Dates open the calendar next to the form field. */
  | { kind: "jump"; fieldId: string; openPicker?: boolean }
  /** Printed by the template: title, logo, labels, payment block. */
  | { kind: "template"; label: string }
  /** Printed from Settings: the seller block. */
  | { kind: "company" };

const field = (
  label: string,
  path: Path<InvoiceInput>,
  fieldId: string,
  input: FieldSpec["input"] = "text",
  suffix?: string,
): FieldSpec => ({ kind: "field", label, path, fieldId, input, suffix });

export function resolveEdit(key: string, currency: string): EditSpec | null {
  const item = /^item\.(\d+)\.(name|description|quantity|rate)$/.exec(key);
  if (item) {
    const index = Number(item[1]);
    const part = item[2] as "name" | "description" | "quantity" | "rate";
    const labels = { name: "Item", description: "Description", quantity: "Quantity", rate: "Rate" };
    return field(
      `Line ${index + 1} · ${labels[part]}`,
      `items.${index}.${part}`,
      itemFieldId(index, part),
      part === "description" ? "textarea" : part === "name" ? "text" : "number",
      part === "rate" ? currency : undefined,
    );
  }

  const tax = /^tax\.(\d+)$/.exec(key);
  if (tax) {
    const index = Number(tax[1]);
    return field(`Tax ${index + 1} rate`, `taxes.${index}.rate`, `tax-${index}-rate`, "number", "%");
  }

  switch (key) {
    case "meta.number":
      return field("Invoice number", "number", "invoice-number");
    case "meta.reference":
      return field("Reference / PO", "reference", "invoice-reference");
    case "meta.issueDate":
      return { kind: "jump", fieldId: "issue-date", openPicker: true };
    case "meta.dueDate":
      return { kind: "jump", fieldId: "due-date", openPicker: true };
    case "buyer.name":
      return field("Customer name", "customer.name", "customer-name");
    case "buyer.address":
      return field("Billing address", "customer.address", "customer-address", "textarea");
    case "buyer.taxId":
      return field("Customer tax ID", "customer.taxId", "customer-tax");
    case "discount":
      return field("Discount", "discount.value", "discount-value", "number");
    case "paid":
    case "balance":
      return field("Already paid", "amountPaid", "amount-paid", "number", currency);
    case "subtotal":
    case "total":
      return { kind: "jump", fieldId: "summary" };
    case "terms":
      return field("Terms & conditions", "terms", "terms", "textarea");
    case "statement":
      return field("Statement", "statement", "statement", "textarea");
    case "seller":
      return { kind: "company" };
    case "title":
      return { kind: "template", label: "Title" };
    case "logo":
      return { kind: "template", label: "Logo" };
    case "labels":
      return { kind: "template", label: "Column labels" };
    case "payment":
      return { kind: "template", label: "Payment details" };
    case "footer":
      return { kind: "template", label: "Page footer" };
    default:
      return null;
  }
}

export type InlineTarget = { spec: FieldSpec; anchor: HTMLElement };

/**
 * A small editor that opens on top of the sheet, right where the text prints.
 * It writes through `setValue`, so the form field, the sheet and validation all
 * stay in sync; "Show in form" jumps to the full field.
 */
export function PreviewEditPopover({
  target,
  form,
  onClose,
  onShowInForm,
}: {
  target: InlineTarget | null;
  form: UseFormReturn<InvoiceInput>;
  onClose: () => void;
  onShowInForm: (fieldId: string) => void;
}) {
  const anchorRef = React.useMemo(() => ({ current: target?.anchor ?? null }), [target]);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const position = useFloating(Boolean(target), anchorRef, {
    width: 320,
    preferredHeight: 280,
    flipBelow: 220,
  });

  useDismiss(Boolean(target), [panelRef], onClose);

  // Mark the piece of the sheet being edited.
  React.useEffect(() => {
    if (!target) return;
    target.anchor.setAttribute("data-editing", "");
    return () => target.anchor.removeAttribute("data-editing");
  }, [target]);

  if (!target || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Edit ${target.spec.label}`}
      style={floatingStyle(position, true)}
      className="border border-ink bg-panel p-3 text-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,.55)]"
    >
      <InlineField key={target.spec.path} spec={target.spec} form={form} onClose={onClose} />
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onShowInForm(target.spec.fieldId)}
          className="inline-flex items-center gap-1 text-micro text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          Show in form
          <ArrowUpRight className="h-3 w-3" />
        </button>
        <Button size="sm" variant="solid" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>,
    position.container,
  );
}

function InlineField({
  spec,
  form,
  onClose,
}: {
  spec: FieldSpec;
  form: UseFormReturn<InvoiceInput>;
  onClose: () => void;
}) {
  const value = useWatch({ control: form.control, name: spec.path }) as unknown;
  const error = form.getFieldState(spec.path, form.formState).error?.message;
  const number = spec.input === "number";
  const [draft, setDraft] = React.useState(() =>
    number ? (Number.isFinite(value) ? String(value) : "") : String(value ?? ""),
  );

  const write = (next: string) => {
    setDraft(next);
    const parsed = number ? (next.trim() === "" ? Number.NaN : Number(next)) : next;
    form.setValue(spec.path, parsed as never, { shouldDirty: true, shouldValidate: true });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    if (event.key === "Enter" && spec.input !== "textarea") {
      event.preventDefault();
      onClose();
    }
  };

  const id = `inline-${spec.fieldId}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="field-label uppercase tracking-[0.06em]">
          {spec.label}
        </label>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 grid h-6 w-6 place-items-center text-ink-faint hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {spec.input === "textarea" ? (
        <Textarea
          id={id}
          autoFocus
          rows={4}
          value={draft}
          onChange={(event) => write(event.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={Boolean(error)}
        />
      ) : (
        <span className="relative block">
          <Input
            id={id}
            autoFocus
            type={number ? "number" : "text"}
            inputMode={number ? "decimal" : undefined}
            step={number ? "any" : undefined}
            value={draft}
            onChange={(event) => write(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={(event) => event.target.select()}
            aria-invalid={Boolean(error)}
            className={spec.suffix ? "tnum pr-12" : number ? "tnum" : undefined}
          />
          {spec.suffix ? (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-micro text-ink-faint">
              {spec.suffix}
            </span>
          ) : null}
        </span>
      )}
      {error ? (
        <p role="alert" className="text-micro text-signal">
          {error}
        </p>
      ) : (
        <p className="text-micro text-ink-faint">
          {spec.input === "textarea" ? "Changes apply as you type." : "Enter to finish, Esc to close."}
        </p>
      )}
    </div>
  );
}
