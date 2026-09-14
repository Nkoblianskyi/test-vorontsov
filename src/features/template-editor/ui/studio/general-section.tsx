"use client";

import { Controller } from "react-hook-form";

import { Field, SectionHeading } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useTemplateEditor } from "../../model/use-template-editor";
import { ColoursSection } from "./colours-section";
import { LayoutSection } from "./layout-section";
import { LogoField } from "./logo-field";
import { PaymentsSection } from "./payments-section";
import { PresetSection } from "./preset-section";
import { TypeSection } from "./type-section";

/** The General tab: the reference's branding block, plus presets, layout and type. */
export function GeneralSection() {
  const { form } = useTemplateEditor();

  return (
    <div className="space-y-8">
      <PresetSection />

      <section className="space-y-4">
        <SectionHeading index="02" title="General branding" />
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field
              label="Template name"
              htmlFor="template-name"
              required
              error={fieldState.error?.message}
              hint="Only you see it: in the template list and the invoice form."
            >
              <Input
                id="template-name"
                {...field}
                aria-invalid={Boolean(fieldState.error)}
              />
            </Field>
          )}
        />
      </section>

      <ColoursSection />

      <section id="section-logo" className="space-y-4">
        <SectionHeading index="04" title="Logo" />
        <LogoField />
      </section>

      <PaymentsSection />
      <LayoutSection />
      <TypeSection />
    </div>
  );
}
