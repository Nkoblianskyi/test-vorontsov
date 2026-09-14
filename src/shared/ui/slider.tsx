"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/shared/lib/cn";

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-px w-full grow bg-rule-strong">
      <SliderPrimitive.Range className="absolute h-px bg-ink" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-2 cursor-ew-resize border border-ink bg-panel focus-visible:outline-2 focus-visible:outline-signal" />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
