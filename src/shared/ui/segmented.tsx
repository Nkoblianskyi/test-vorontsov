"use client";

import * as React from "react";
import { cn } from "@/shared/lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  name,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  name: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn("flex border border-rule", className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[0.8125rem] transition-colors",
              index > 0 && "border-l border-rule",
              active
                ? "bg-ink text-panel"
                : "bg-panel text-ink-soft hover:bg-panel-sunken hover:text-ink",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
