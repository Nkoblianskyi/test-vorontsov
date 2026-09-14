"use client";

import { Controller, useWatch } from "react-hook-form";

import {
  contentFieldGroups,
  type ContentFieldMeta,
} from "@/entities/template/model/content-fields";
import { cn } from "@/shared/lib/cn";
import { todayIso } from "@/shared/lib/dates";
import { dateFormatOptions } from "@/shared/lib/format";
import { Listbox } from "@/shared/ui/listbox";
import { useTemplateEditor } from "../../model/use-template-editor";
import { referenceSkin, RefSwitch } from "./primitives";
import styles from "./reference.module.css";

function FieldRow({ meta }: { meta: ContentFieldMeta }) {
  const { form } = useTemplateEditor();
  const show = useWatch({
    control: form.control,
    name: `content.fields.${meta.key}.show` as const,
  });

  return (
    <div className={styles.fieldRow}>
      <Controller
        control={form.control}
        name={`content.fields.${meta.key}.show` as const}
        render={({ field }) => (
          <RefSwitch
            checked={meta.locked ? true : field.value}
            onChange={field.onChange}
            label={meta.title}
            disabled={meta.locked}
          />
        )}
      />
      {meta.labelEditable ? (
        <Controller
          control={form.control}
          name={`content.fields.${meta.key}.label` as const}
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                disabled={!show}
                placeholder={meta.placeholder ?? meta.title}
                aria-label={`${meta.title} label`}
                className={cn(styles.input, fieldState.error && styles.invalid)}
              />
              {fieldState.error ? (
                <p className={styles.error}>{fieldState.error.message}</p>
              ) : null}
            </>
          )}
        />
      ) : null}
    </div>
  );
}

export function ContentTab() {
  const { form } = useTemplateEditor();

  return (
    <>
      <h3 className={styles.sectionTitle}>Content</h3>
      <p className={styles.sectionDesc}>
        Choose which details appear in the paper and rename their labels.
      </p>

      <Controller
        control={form.control}
        name="content.documentTitle"
        render={({ field, fieldState }) => (
          <div className={styles.group}>
            <label htmlFor="rf-title" className={styles.label}>
              Document Title <span className={styles.required}>*</span>
            </label>
            <input
              id="rf-title"
              {...field}
              maxLength={28}
              className={cn(styles.input, fieldState.error && styles.invalid)}
            />
            {fieldState.error ? (
              <p className={styles.error}>{fieldState.error.message}</p>
            ) : null}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="content.dateFormat"
        render={({ field }) => (
          <div className={styles.group}>
            <label htmlFor="rf-date" className={styles.label}>
              Date Format
            </label>
            <Listbox
              id="rf-date"
              value={field.value}
              onChange={field.onChange}
              options={dateFormatOptions(todayIso())}
              skin={referenceSkin}
            />
            <p className={styles.hint}>The dates themselves are picked on each invoice.</p>
          </div>
        )}
      />

      {contentFieldGroups.map((group) => (
        <div key={group.id} className={styles.fieldGroup}>
          <p className={styles.groupTitle}>{group.title}</p>
          {group.hint ? <p className={styles.hint}>{group.hint}</p> : null}
          {group.fields.map((meta) => (
            <FieldRow key={meta.key} meta={meta} />
          ))}
        </div>
      ))}

      <Controller
        control={form.control}
        name="content.terms"
        render={({ field, fieldState }) => (
          <div className={styles.fieldGroup}>
            <label htmlFor="rf-terms" className={styles.label}>
              Default Terms &amp; Conditions
            </label>
            <textarea
              id="rf-terms"
              {...field}
              rows={3}
              maxLength={600}
              className={styles.textarea}
            />
            {fieldState.error ? (
              <p className={styles.error}>{fieldState.error.message}</p>
            ) : null}
          </div>
        )}
      />
      <Controller
        control={form.control}
        name="content.statement"
        render={({ field }) => (
          <div className={styles.group}>
            <label htmlFor="rf-statement" className={styles.label}>
              Default Statement
            </label>
            <textarea
              id="rf-statement"
              {...field}
              rows={2}
              maxLength={600}
              className={styles.textarea}
            />
            <p className={styles.hint}>Copied into new invoices made with this template.</p>
          </div>
        )}
      />
    </>
  );
}
