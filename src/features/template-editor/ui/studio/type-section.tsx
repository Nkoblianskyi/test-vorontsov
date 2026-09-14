"use client";

import { Controller } from "react-hook-form";

import { Field, SectionHeading } from "@/shared/ui/field";
import { Segmented } from "@/shared/ui/segmented";
import { Slider } from "@/shared/ui/slider";
import { useTemplateEditor } from "../../model/use-template-editor";

export function TypeSection() {
  const { form } = useTemplateEditor();

  return (
    <section className="space-y-4">
      <SectionHeading index="07" title="Type" />
      <Controller
        control={form.control}
        name="typeface"
        render={({ field }) => (
          <Field label="Typeface">
            <Segmented
              name="Typeface"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "system", label: "System" },
                { value: "grotesque", label: "Grotesque" },
                { value: "serif", label: "Serif" },
              ]}
            />
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="typeScale"
        render={({ field }) => (
          <Field
            label="Text size"
            action={<span className="field-label tnum">{field.value}%</span>}
            hint="Scales every size on the sheet at once."
          >
            <div className="py-2">
              <Slider
                min={90}
                max={115}
                step={1}
                value={[field.value]}
                onValueChange={([next]) => field.onChange(next)}
                aria-label="Text size"
              />
            </div>
          </Field>
        )}
      />
    </section>
  );
}
