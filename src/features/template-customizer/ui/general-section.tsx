"use client";

import { Controller } from "react-hook-form";

import { Field, SectionHeading, ToggleRow } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Slider } from "@/shared/ui/slider";
import { Switch } from "@/shared/ui/switch";
import { Segmented } from "@/shared/ui/segmented";
import { cn } from "@/shared/lib/cn";

import { useTemplateEditor } from "../model/use-template-editor";
import { templatePresets } from "../model/presets";
import { ColorField } from "./color-field";
import { LogoField } from "./logo-field";

const brandSwatches = ["#0b5d3b", "#1f3a6e", "#c81e14", "#7a3cc0", "#b2560d", "#111111"];
const inkSwatches = ["#111111", "#000000", "#1a1a18", "#20242b"];
const paperSwatches = ["#ffffff", "#fbf8f1", "#f6f7f4", "#f4f1ea"];

export function GeneralSection() {
  const { form, config, applyPreset, activePresetId } = useTemplateEditor();

  return (
    <div className="space-y-7">
      <section className="space-y-3">
        <SectionHeading
          title="Preset"
          description="A starting point. Everything below stays editable."
        />
        <div className="grid grid-cols-2 gap-px bg-rule">
          {templatePresets.map((preset) => {
            const active = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                aria-pressed={active}
                className={cn(
                  "group flex flex-col gap-2 bg-panel p-3 text-left transition-colors",
                  active ? "bg-ink text-panel" : "hover:bg-panel-sunken",
                )}
              >
                <span
                  className="h-6 w-full border"
                  style={{ background: preset.swatch, borderColor: preset.swatch }}
                />
                <span className="text-[0.8125rem] font-medium">{preset.name}</span>
                <span
                  className={cn(
                    "text-micro leading-snug",
                    active ? "text-panel/70" : "text-ink-faint",
                  )}
                >
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Identity" />

        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field label="Template name" htmlFor="template-name">
              <Input id="template-name" {...field} />
              {fieldState.error ? (
                <p className="text-micro text-signal">{fieldState.error.message}</p>
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="brandColor"
          render={({ field, fieldState }) => (
            <ColorField
              label="Brand colour"
              value={field.value}
              onChange={field.onChange}
              swatches={brandSwatches}
              contrastAgainst={{ color: "#ffffff", label: "White text on the brand block" }}
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
              swatches={inkSwatches}
              contrastAgainst={{ color: config.paperTint, label: "Body text on paper" }}
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
              swatches={paperSwatches}
              error={fieldState.error?.message}
            />
          )}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Logo" />
        <LogoField />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Type" />

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
                />
              </div>
            </Field>
          )}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Layout" />

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
                name="Density"
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
              description="Skipped automatically when the header is a banner."
              control={<Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          )}
        />
      </section>
    </div>
  );
}
