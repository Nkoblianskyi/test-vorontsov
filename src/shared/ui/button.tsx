"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        solid: "border-ink bg-ink text-panel hover:bg-ink-soft hover:border-ink-soft",
        outline: "border-rule bg-panel text-ink hover:border-ink hover:bg-panel-sunken",
        ghost:
          "border-transparent bg-transparent text-ink-soft hover:text-ink hover:bg-panel-sunken",
        signal:
          "border-signal bg-signal text-[var(--color-signal-ink)] hover:brightness-110",
      },
      size: {
        sm: "h-8 px-3 text-[0.8125rem]",
        md: "h-10 px-4 text-sm",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
