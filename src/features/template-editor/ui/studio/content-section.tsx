"use client";

import { Controller, useWatch } from "react-hook-form";

import {
  contentFieldGroups,
  type ContentFieldMeta,
} from "@/entities/template/model/content-fields";
import { dateFormatOptions } from "@/shared/lib/format";
import { todayIso } from "@/shared/lib/dates";
import { Field, SectionHeading } from "@/shared/ui/field";
import { Input, Textarea } from "@/shared/ui/input";
import { Listbox } from "@/shared/ui/listbox";
import { Switch } from "@/shared/ui/switch";
import { cn } from "@/shared/lib/cn";
import { useTemplateEditor } from "../../model/use-template-editor";

function FieldRow({ meta }: { meta: ContentFieldMeta }) {
  const { form } = useTemplateEditor();
  const show = useWatch({
    control: form.control,
    name: `content.fields.${meta.key}.show` as const,
  });

  return (
    <div
      id={`field-row-${meta.key}`}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-b border-rule py-2.5 last:border-b-0"
    >
      <p className={cn("text-sm", show ? "text-ink" : "text-ink-faint")}>{meta.title}</p>

      {meta.locked ? (
        <span className="text-micro text-ink-faint">Always printed</span>
      ) : (
        <Controller
          control={form.control}
          name={`content.fields.${meta.key}.show` as const}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label={`Show ${meta.title}`}
            />
          )}
        />
      )}

      {meta.labelEditable ? (
        <Controller
          control={form.control}
          name={`content.fields.${meta.key}.label` as const}
          render={({ field, fieldState }) => (
            <div className="col-span-2 space-y-1">
              <Input
                {...field}
                disabled={!show}
                placeholder={meta.placeholder ?? meta.title}
                aria-label={`${meta.title} label`}
                className="h-8 text-[0.8125rem] disabled:bg-panel-sunken disabled:text-ink-faint"
              />
              {fieldState.error ? (
                <p role="alert" className="text-micro text-signal">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />
      ) : null}
    </div>
  );
}

export function ContentSection() {
  const { form } = useTemplateEditor();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeading index="01" title="Document" />
        <Controller
          control={form.control}
          name="content.documentTitle"
          render={({ field, fieldState }) => (
            <Field
              label="Title"
              htmlFor="document-title"
              required
              error={fieldState.error?.message}
              hint="The big word on top of the sheet."
            >
              <Input id="document-title" {...field} maxLength={28} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="content.dateFormat"
          render={({ field }) => (
            <Field
              label="Date format"
              htmlFor="date-format"
              hint="How dates print. The dates themselves are picked on each invoice, with a calendar."
            >
              <Listbox
                id="date-format"
                value={field.value}
                onChange={field.onChange}
                options={dateFormatOptions(todayIso())}
              />
            </Field>
          )}
        />
      </section>

      {contentFieldGroups.map((group, index) => (
        <section key={group.id} className="space-y-1">
          <SectionHeading
            index={String(index + 2).padStart(2, "0")}
            title={group.title}
            description={group.hint}
          />
          <div>
            {group.fields.map((meta) => (
              <FieldRow key={meta.key} meta={meta} />
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-4">
        <SectionHeading
          index={String(contentFieldGroups.length + 2).padStart(2, "0")}
          title="Default text"
          description="Copied into every new invoice made with this template, where it can still be edited."
        />
        <Controller
          control={form.control}
          name="content.terms"
          render={({ field, fieldState }) => (
            <Field
              label="Terms & conditions"
              htmlFor="default-terms"
              error={fieldState.error?.message}
              action={<span className="field-label tnum">{field.value.length}/600</span>}
            >
              <Textarea id="default-terms" {...field} maxLength={600} rows={3} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="content.statement"
          render={({ field, fieldState }) => (
            <Field
              label="Statement"
              htmlFor="default-statement"
              error={fieldState.error?.message}
              action={<span className="field-label tnum">{field.value.length}/600</span>}
            >
              <Textarea id="default-statement" {...field} maxLength={600} rows={2} />
            </Field>
          )}
        />
      </section>
    </div>
  );
}
