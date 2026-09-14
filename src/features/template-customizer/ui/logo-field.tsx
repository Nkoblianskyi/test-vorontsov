"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { Controller } from "react-hook-form";

import { Field, ToggleRow } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Slider } from "@/shared/ui/slider";
import { Segmented } from "@/shared/ui/segmented";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { useTemplateEditor } from "../model/use-template-editor";
import { logoShapeValues } from "../model/schema";

const MAX_BYTES = 1024 * 512;

export function LogoField() {
  const { form, config } = useTemplateEditor();
  const [dragging, setDragging] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const readFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProblem("That file is not an image. Use PNG, JPG or SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setProblem("Keep the logo under 512 KB so invoices stay light to email.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProblem(null);
      form.setValue("logo.src", String(reader.result), { shouldDirty: true });
      form.setValue("logo.show", true, { shouldDirty: true });
    };
    reader.onerror = () => setProblem("The file could not be read. Try another one.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <ToggleRow
        label="Show logo"
        description="Hidden logos keep the monogram off the sheet too."
        control={
          <Controller
            control={form.control}
            name="logo.show"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        }
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          readFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex items-center gap-3 border border-dashed p-3 transition-colors",
          dragging ? "border-ink bg-panel-sunken" : "border-rule",
        )}
      >
        <div
          className="grid h-14 w-14 shrink-0 place-items-center border border-rule"
          style={{
            background: config.logo.src ? "transparent" : config.brandColor,
            color: "#fff",
          }}
        >
          {config.logo.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logo.src} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-sm font-semibold">{config.logo.monogram || "–"}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-micro leading-relaxed text-ink-soft">
            Drop an image here, or pick a file. PNG, JPG or SVG up to 512 KB.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Choose file
            </Button>
            {config.logo.src ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => form.setValue("logo.src", null, { shouldDirty: true })}
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(event) => readFile(event.target.files?.[0])}
        />
      </div>

      {problem ? <p className="text-micro text-signal">{problem}</p> : null}

      {!config.logo.src ? (
        <Controller
          control={form.control}
          name="logo.monogram"
          render={({ field, fieldState }) => (
            <Field
              label="Monogram"
              hint="Used while there is no logo file. Up to three characters."
            >
              <Input
                {...field}
                maxLength={3}
                onChange={(event) => field.onChange(event.target.value.toUpperCase())}
              />
              {fieldState.error ? (
                <p className="text-micro text-signal">{fieldState.error.message}</p>
              ) : null}
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
                label:
                  shape === "bare" ? "No block" : shape[0].toUpperCase() + shape.slice(1),
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
            action={<span className="field-label tnum">{field.value} pt</span>}
          >
            <div className="py-2">
              <Slider
                min={40}
                max={120}
                step={2}
                value={[field.value]}
                onValueChange={([next]) => field.onChange(next)}
              />
            </div>
          </Field>
        )}
      />
    </div>
  );
}
