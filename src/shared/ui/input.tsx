"use client";

import * as React from "react";
import { cn } from "@/shared/lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full border border-rule bg-panel px-3 text-sm text-ink placeholder:text-ink-faint",
      "hover:border-ink-faint focus:border-ink focus:outline-none focus:ring-0",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-20 w-full resize-y border border-rule bg-panel px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-faint",
      "hover:border-ink-faint focus:border-ink focus:outline-none",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
