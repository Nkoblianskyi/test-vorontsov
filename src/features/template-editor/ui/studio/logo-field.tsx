"use client";

import { Upload, X } from "lucide-react";
import { Controller } from "react-hook-form";

import { logoShapeValues } from "@/entities/template/model/schema";
import { LogoMark } from "@/entities/template/ui/logo-mark";
import { Field, ToggleRow } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Slider } from "@/shared/ui/slider";
import { Segmented } from "@/shared/ui/segmented";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { useLogoUpload } from "../../model/use-logo-upload";
import { useTemplateEditor } from "../../model/use-template-editor";

const shapeLabels: Record<(typeof logoShapeValues)[number], string> = {
  square: "Square",
  circle: "Circle",
  bare: "No block",
};

/** Size is stored in points; the slider reads as a percentage of the default. */
const DEFAULT_LOGO_SIZE = 64;

export function LogoField() {
  const { form, config } = useTemplateEditor();
  const upload = useLogoUpload();

  return (
    <div className="space-y-3">
      <Controller
        control={form.control}
        name="logo.show"
        render={({ field }) => (
          <ToggleRow
            label="Display company logo on the paper"
            control={
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="Display company logo on the paper"
              />
            }
          />
        )}
      />

      <div
        {...upload.dropProps}
        className={cn(
          "flex items-center gap-3 border border-dashed p-3 transition-colors",
          upload.dragging ? "border-ink bg-panel-sunken" : "border-rule",
          !config.logo.show && "opacity-50",
        )}
      >
        <div className="grid h-14 w-14 shrink-0 place-items-center border border-rule bg-white">
          <LogoMark
            logo={{ ...config.logo, show: true }}
            color={config.primaryColor}
            box="54px"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-micro leading-relaxed text-ink-soft">
            Drop an image here or choose a file. PNG, JPG, SVG or WebP up to 512 KB.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={upload.openPicker}>
              <Upload className="h-3.5 w-3.5" />
              {config.logo.src ? "Replace" : "Choose file"}
            </Button>
            {config.logo.src ? (
              <Button type="button" size="sm" variant="ghost" onClick={upload.remove}>
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <input {...upload.inputProps} />
      </div>

      {upload.problem ? (
        <p role="alert" className="text-micro text-signal">
          {upload.problem}
        </p>
      ) : null}

      {!config.logo.src ? (
        <Controller
          control={form.control}
          name="logo.monogram"
          render={({ field, fieldState }) => (
            <Field
              label="Monogram"
              htmlFor="logo-monogram"
              hint="Printed while there is no logo file. Up to three characters."
              error={fieldState.error?.message}
            >
              <Input
                id="logo-monogram"
                {...field}
                maxLength={3}
                onChange={(event) => field.onChange(event.target.value.toUpperCase())}
              />
            </Field>
          )}
        />
      ) : null}

      <Controller
        control={form.control}
        name="logo.shape"
        render={({ field }) => (
          <Field label="Shape">
            <Segmented
              name="Logo shape"
              value={field.value}
              onChange={field.onChange}
              options={logoShapeValues.map((shape) => ({
                value: shape,
                label: shapeLabels[shape],
              }))}
            />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="logo.size"
        render={({ field }) => (
          <Field
            label="Size"
            action={
              <span className="field-label tnum">
                {Math.round((field.value / DEFAULT_LOGO_SIZE) * 100)}%
              </span>
            }
          >
            <div className="py-2">
              <Slider
                min={40}
                max={120}
                step={2}
                value={[field.value]}
                onValueChange={([next]) => field.onChange(next)}
                aria-label="Logo size"
              />
            </div>
          </Field>
        )}
      />
    </div>
  );
}
