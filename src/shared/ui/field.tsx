import * as React from "react";
import { cn } from "@/shared/lib/cn";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
  action,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="field-label">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint ? <p className="text-micro text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function ToggleRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-rule py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-ink">{label}</p>
        {description ? <p className="text-micro text-ink-faint">{description}</p> : null}
      </div>
      {control}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-rule-strong pb-2">
      <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 text-micro leading-relaxed text-ink-soft">{description}</p>
      ) : null}
    </div>
  );
}
