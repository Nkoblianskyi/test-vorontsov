"use client";

import * as React from "react";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { auditContrast, normalizeHex } from "@/shared/lib/color";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  swatches: string[];
  contrastAgainst?: { color: string; label: string };
  error?: string;
};

export function ColorField({
  label,
  value,
  onChange,
  swatches,
  contrastAgainst,
  error,
}: Props) {
  const id = React.useId();
  const [draft, setDraft] = React.useState(value);
  const [lastValue, setLastValue] = React.useState(value);

  // Undo, presets and swatches change the value from outside: adjust during render
  // rather than in an effect, so the input never paints a stale hex.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const commit = (next: string) => {
    const hex = normalizeHex(next);
    if (hex) onChange(hex);
    else setDraft(value);
  };

  const audit = contrastAgainst
    ? auditContrast(contrastAgainst.color, value, contrastAgainst.label)
    : null;

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={
        audit ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              audit.level === "fail" && "text-signal",
            )}
          >
            <span className="tnum">{audit.ratio.toFixed(2)}:1</span>
            {audit.message}
          </span>
        ) : undefined
      }
    >
      <div className="flex items-stretch gap-2">
        <label
          className="relative h-10 w-10 shrink-0 cursor-pointer border border-rule"
          style={{ background: value }}
          aria-label={`${label} colour picker`}
        >
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          id={id}
          value={draft}
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
            }
          }}
          className="tnum uppercase"
        />
      </div>

      <div className="flex gap-1 pt-1">
        {swatches.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            aria-label={swatch}
            className={cn(
              "h-5 w-5 border transition-transform",
              swatch.toLowerCase() === value.toLowerCase()
                ? "border-ink scale-110"
                : "border-rule hover:scale-110",
            )}
            style={{ background: swatch }}
          />
        ))}
      </div>

      {error ? <p className="text-micro text-signal">{error}</p> : null}
    </Field>
  );
}
