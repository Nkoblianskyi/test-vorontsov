"use client";

import { Controller } from "react-hook-form";

import { Field, SectionHeading, ToggleRow } from "@/shared/ui/field";
import { Segmented } from "@/shared/ui/segmented";
import { Switch } from "@/shared/ui/switch";
import { useTemplateEditor } from "../../model/use-template-editor";

/** Base layout first; the Swiss-only controls appear when the Swiss grid is chosen. */
export function LayoutSection() {
  const { form, config } = useTemplateEditor();

  return (
    <section className="space-y-4">
      <SectionHeading
        index="06"
        title="Layout"
        description="Classic follows the reference sheet. Swiss is our grid layout with more controls."
      />
      <Controller
        control={form.control}
        name="design"
        render={({ field }) => (
          <Field label="Base layout">
            <Segmented
              name="Base layout"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "classic", label: "Classic" },
                { value: "swiss", label: "Swiss grid" },
              ]}
            />
          </Field>
        )}
      />

      {config.design === "swiss" ? (
        <>
          <Controller
            control={form.control}
            name="headerLayout"
            render={({ field }) => (
              <Field label="Header">
                <Segmented
                  name="Header layout"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "split", label: "Split" },
                    { value: "stacked", label: "Stacked" },
                    { value: "banner", label: "Banner" },
                  ]}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="ruleWeight"
            render={({ field }) => (
              <Field label="Rules">
                <Segmented
                  name="Rule weight"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "hairline", label: "Hairline" },
                    { value: "bold", label: "Bold" },
                    { value: "none", label: "None" },
                  ]}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="density"
            render={({ field }) => (
              <Field label="Spacing">
                <Segmented
                  name="Spacing"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "compact", label: "Compact" },
                    { value: "regular", label: "Regular" },
                    { value: "airy", label: "Airy" },
                  ]}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="accentBand"
            render={({ field }) => (
              <ToggleRow
                label="Colour band at the top"
                description="Skipped automatically with the banner header."
                control={
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Colour band at the top"
                  />
                }
              />
            )}
          />
        </>
      ) : (
        <p className="border-l-2 border-rule-strong pl-3 text-micro leading-relaxed text-ink-soft">
          Header, rules and spacing belong to the Swiss grid layout. Classic keeps the
          reference proportions; colours, logo, type and content still apply.
        </p>
      )}
    </section>
  );
}
