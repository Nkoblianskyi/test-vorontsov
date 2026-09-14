"use client";

import { Field, SectionHeading } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/input";
import type { InvoiceEditorApi } from "../model/use-invoice-editor";

const MAX_NOTE = 600;

export function NotesSection({ editor }: { editor: InvoiceEditorApi }) {
  const { form, values, applyTemplateText } = editor;
  const { errors } = form.formState;

  return (
    <section className="space-y-4">
      <SectionHeading
        index="05"
        title="Notes"
        action={
          <button
            type="button"
            onClick={applyTemplateText}
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
        action={
          <span className="field-label tnum">
            {values.terms?.length ?? 0}/{MAX_NOTE}
          </span>
        }
      >
        <Textarea
          id="terms"
          rows={3}
          maxLength={MAX_NOTE}
          className="[field-sizing:content]"
          {...form.register("terms")}
        />
      </Field>
      <Field
        label="Statement"
        htmlFor="statement"
        error={errors.statement?.message}
        action={
          <span className="field-label tnum">
            {values.statement?.length ?? 0}/{MAX_NOTE}
          </span>
        }
      >
        <Textarea
          id="statement"
          rows={2}
          maxLength={MAX_NOTE}
          className="[field-sizing:content]"
          {...form.register("statement")}
        />
      </Field>
    </section>
  );
}
