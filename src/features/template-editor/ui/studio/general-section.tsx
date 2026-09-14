"use client";

import * as React from "react";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Controller } from "react-hook-form";

import { templatePresets } from "@/entities/template/model/presets";
import { Field, SectionHeading, ToggleRow } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Slider } from "@/shared/ui/slider";
import { Switch } from "@/shared/ui/switch";
import { Segmented } from "@/shared/ui/segmented";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { readableInk } from "@/shared/lib/color";

import { useTemplateEditor } from "../../model/use-template-editor";
import { ColorField } from "./color-field";
import { LogoField } from "./logo-field";
import { PaymentMethodsDialog, paymentSummary } from "./payment-methods-dialog";

const brandSwatches = ["#2c3dd8", "#0b5d3b", "#1f3a6e", "#c81e14", "#7a3cc0", "#b2560d", "#111111"];
const inkSwatches = ["#111111", "#000000", "#1a1a18", "#20242b"];
const paperSwatches = ["#ffffff", "#fbf8f1", "#f6f7f4", "#f4f1ea"];

export function GeneralSection() {
  const { form, config, applyPreset, activePresetId } = useTemplateEditor();
  const [paymentsOpen, setPaymentsOpen] = React.useState(false);
  const paymentErrors = form.formState.errors.payments;
  const swiss = config.design === "swiss";

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeading
          index="01"
          title="Preset"
          description="A starting point for the look. Your wording and logo stay as they are."
        />
        <div className="grid grid-cols-2 gap-px border border-rule bg-rule">
          {templatePresets.map((preset) => {
            const active = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-2 p-3 text-left transition-colors",
                  active ? "bg-ink text-panel" : "bg-panel hover:bg-panel-sunken",
                )}
              >
                <span className="flex h-6 w-full">
                  <span className="flex-[3]" style={{ background: preset.look.primaryColor }} />
                  <span className="flex-1" style={{ background: preset.look.secondaryColor }} />
                  <span className="flex-1 border border-rule" style={{ background: preset.look.paperTint }} />
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.8125rem] font-medium">{preset.name}</span>
                  <span className={cn("text-micro", active ? "text-panel/60" : "text-ink-faint")}>
                    {preset.look.design === "classic" ? "Classic" : "Swiss"}
                  </span>
                </span>
                <span className={cn("text-micro leading-snug", active ? "text-panel/70" : "text-ink-faint")}>
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

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
              <Input id="template-name" {...field} aria-invalid={Boolean(fieldState.error)} />
            </Field>
          )}
        />
      </section>

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
              swatches={brandSwatches}
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
              swatches={brandSwatches}
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
              swatches={inkSwatches}
              contrast={{ foreground: field.value, background: config.paperTint, label: "Body text on paper" }}
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

      <section id="section-logo" className="space-y-4">
        <SectionHeading index="04" title="Logo" />
        <LogoField />
      </section>

      <section id="section-payments" className="space-y-3">
        <SectionHeading index="05" title="Payments" />
        <div
          className={cn(
            "flex items-center justify-between gap-3 border bg-panel-sunken p-3",
            paymentErrors ? "border-signal" : "border-rule",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            {paymentErrors ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-signal" aria-hidden />
            ) : (
              <CreditCard className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-sm">Accept payment methods</p>
              <p className={cn("truncate text-micro", paymentErrors ? "text-signal" : "text-ink-faint")}>
                {paymentErrors ? "A method needs details" : paymentSummary(config.payments)}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setPaymentsOpen(true)}>
            Manage
          </Button>
        </div>
        <PaymentMethodsDialog open={paymentsOpen} onClose={() => setPaymentsOpen(false)} />
      </section>

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

        {swiss ? (
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
    </div>
  );
}
