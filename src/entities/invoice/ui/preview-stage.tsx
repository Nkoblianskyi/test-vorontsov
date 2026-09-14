"use client";

import * as React from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { ScaledSheet, SHEET_WIDTH } from "./sheet";

const ZOOM_STEPS = [0.5, 0.75, 1];
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;

/**
 * The canvas behind every live preview: a faint grid, the A4 sheet, and zoom.
 * "Fit" follows the available width, so resizing the window never hides the sheet.
 */
export function PreviewStage({
  children,
  toolbar,
  className,
  onPick,
}: {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
  /** Called with the `data-edit` key of whatever was clicked on the sheet. */
  onPick?: (key: string, element: HTMLElement) => void;
}) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = React.useState(0.7);
  const [zoom, setZoom] = React.useState<number | "fit">("fit");

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      setFitScale(Math.min(1, Math.max(MIN_ZOOM, entry.contentRect.width / SHEET_WIDTH)));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const scale = zoom === "fit" ? fitScale : zoom;
  const step = (delta: number) =>
    setZoom(
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((scale + delta) * 100) / 100)),
    );

  return (
    <div
      data-print="shell"
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}
    >
      <div
        data-print="hide"
        className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-rule bg-panel px-3 sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-2">{toolbar}</div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            onClick={() => step(-0.1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span
            className="tnum w-11 text-center text-[0.8125rem] text-ink-soft"
            aria-live="polite"
          >
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            onClick={() => step(0.1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div
            className="ml-1 hidden border border-rule sm:flex"
            role="group"
            aria-label="Zoom presets"
          >
            <button
              type="button"
              onClick={() => setZoom("fit")}
              aria-pressed={zoom === "fit"}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-[0.8125rem] transition-colors",
                zoom === "fit"
                  ? "bg-ink text-panel"
                  : "text-ink-soft hover:bg-panel-sunken",
              )}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Fit
            </button>
            {ZOOM_STEPS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setZoom(value)}
                aria-pressed={zoom === value}
                className={cn(
                  "tnum border-l border-rule px-2 py-1 text-[0.8125rem] transition-colors",
                  zoom === value
                    ? "bg-ink text-panel"
                    : "text-ink-soft hover:bg-panel-sunken",
                )}
              >
                {value * 100}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={stageRef}
        data-print="stage"
        onClick={
          onPick
            ? (event) => {
                const target = (event.target as HTMLElement).closest<HTMLElement>(
                  "[data-edit]",
                );
                if (target?.dataset.edit && event.currentTarget.contains(target)) {
                  onPick(target.dataset.edit, target);
                }
              }
            : undefined
        }
        className={cn(
          "stage-grid min-h-0 flex-1 overflow-auto bg-canvas px-4 py-6 sm:px-10 sm:py-10",
          onPick && "preview-editable",
        )}
      >
        <ScaledSheet scale={scale}>{children}</ScaledSheet>
      </div>
    </div>
  );
}
