import * as React from "react";
import { cn } from "@/shared/lib/cn";

const tones = {
  neutral: "border-rule text-ink-soft",
  ink: "border-ink text-ink",
  solid: "border-ink bg-ink text-panel",
  positive: "border-positive text-positive",
  signal: "border-signal text-signal",
  faint: "border-dashed border-ink-faint text-ink-soft",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 border px-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.06em] whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
