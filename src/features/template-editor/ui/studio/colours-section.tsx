"use client";

import { Controller } from "react-hook-form";

import { readableInk } from "@/shared/lib/color";
import { SectionHeading } from "@/shared/ui/field";
import { useTemplateEditor } from "../../model/use-template-editor";
import { ColorField } from "./color-field";

const BRAND_SWATCHES = [
  "#2c3dd8",
  "#0b5d3b",
  "#1f3a6e",
  "#c81e14",
  "#7a3cc0",
  "#b2560d",
  "#111111",
];
const INK_SWATCHES = ["#111111", "#000000", "#1a1a18", "#20242b"];
const PAPER_SWATCHES = ["#ffffff", "#fbf8f1", "#f6f7f4", "#f4f1ea"];

export function ColoursSection() {
  const { form, config } = useTemplateEditor();

  return (
    <section className="space-y-5">
      <SectionHeading
        index="03"
        title="Colours"
        description="Primary marks the sheet: top rule, banner, logo block. Secondary carries payment details and the balance due."
      />
      <Controller
        control={form.control}
        name="primaryColor"
        render={({ field, fieldState }) => (
          <ColorField
            label="Primary colour"
            value={field.value}
            onChange={field.onChange}
            swatches={BRAND_SWATCHES}
            contrast={{
              foreground: readableInk(field.value),
              background: field.value,
              label: "Text on the colour block",
            }}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="secondaryColor"
        render={({ field, fieldState }) => (
          <ColorField
            label="Secondary colour"
            value={field.value}
            onChange={field.onChange}
            swatches={BRAND_SWATCHES}
            contrast={{
              foreground: field.value,
              background: config.paperTint,
              label: "Coloured text on paper",
            }}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="inkColor"
        render={({ field, fieldState }) => (
          <ColorField
            label="Text colour"
            value={field.value}
            onChange={field.onChange}
            swatches={INK_SWATCHES}
            contrast={{
              foreground: field.value,
              background: config.paperTint,
              label: "Body text on paper",
            }}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="paperTint"
        render={({ field, fieldState }) => (
          <ColorField
            label="Paper"
            value={field.value}
            onChange={field.onChange}
            swatches={PAPER_SWATCHES}
            error={fieldState.error?.message}
          />
        )}
      />
    </section>
  );
}
