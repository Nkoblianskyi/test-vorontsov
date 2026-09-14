import * as React from "react";
import { cn } from "@/shared/lib/cn";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
  className,
  action,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required ? (
            <span className="text-signal" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-micro text-signal">
          {error}
        </p>
      ) : hint ? (
        <p className="text-micro text-ink-faint">{hint}</p>
      ) : null}
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
  action,
  index,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  index?: string;
}) {
  return (
    <div className="border-b border-rule-strong pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-baseline gap-2 text-sm font-semibold tracking-tight text-ink">
          {index ? <span className="tnum text-micro font-medium text-ink-faint">{index}</span> : null}
          {title}
        </h2>
        {action}
      </div>
      {description ? (
        <p className="mt-1 text-micro leading-relaxed text-ink-soft">{description}</p>
      ) : null}
    </div>
  );
}
