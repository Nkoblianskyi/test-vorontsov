"use client";

import * as React from "react";
import { cn } from "@/shared/lib/cn";

const MM_TO_PX = 96 / 25.4;
export const SHEET_WIDTH = 210 * MM_TO_PX;
export const SHEET_HEIGHT = 297 * MM_TO_PX;

/**
 * An A4 sheet drawn at a given scale. The frame reserves the scaled size so the
 * page scrolls correctly; the sheet itself keeps real millimetres for print.
 */
export function ScaledSheet({
  scale,
  children,
  className,
}: {
  scale: number;
  children: React.ReactNode;
  className?: string;
}) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(SHEET_HEIGHT);

  React.useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(Math.max(SHEET_HEIGHT, entry.contentRect.height));
    });
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      data-print="frame"
      className={cn("mx-auto", className)}
      style={{ width: SHEET_WIDTH * scale, height: height * scale }}
    >
      <div
        ref={sheetRef}
        data-print="sheet"
        className="sheet-shadow"
        style={{
          width: SHEET_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A non-interactive thumbnail that fills its container's width, cropped to A4. */
export function SheetThumbnail({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / SHEET_WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("relative aspect-[210/297] w-full overflow-hidden bg-white", className)}
    >
      {scale > 0 ? (
        <div
          inert
          // Absolute: the 794 px sheet must not count towards the box's intrinsic width,
          // or an auto-sized grid column (a phone layout) grows to fit it.
          className="pointer-events-none absolute top-0 left-0 select-none"
          style={{
            width: SHEET_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
