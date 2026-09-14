import * as React from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-rule-strong pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="field-label mb-1 uppercase tracking-[0.08em]">{eyebrow}</p>
        ) : null}
        <h1 className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
