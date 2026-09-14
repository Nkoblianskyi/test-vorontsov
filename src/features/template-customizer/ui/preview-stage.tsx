"use client";

import * as React from "react";
import { Minus, Plus, Maximize2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { InvoiceDocument } from "@/entities/invoice/ui/invoice-document";
import { sampleInvoice } from "@/entities/invoice/model/invoice";
import { useTemplateEditor } from "../model/use-template-editor";

const MM_TO_PX = 96 / 25.4;
const SHEET_WIDTH = 210 * MM_TO_PX;
const SHEET_HEIGHT = 297 * MM_TO_PX;
const STAGE_PADDING = 96;

export function PreviewStage() {
  const { config } = useTemplateEditor();
  const stageRef = React.useRef<HTMLDivElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  const [fitScale, setFitScale] = React.useState(0.72);
  const [zoom, setZoom] = React.useState<number | "fit">("fit");
  const [sheetHeight, setSheetHeight] = React.useState(SHEET_HEIGHT);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - STAGE_PADDING;
      setFitScale(Math.min(1, Math.max(0.3, available / SHEET_WIDTH)));
    });

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const observer = new ResizeObserver(([entry]) => {
      setSheetHeight(Math.max(SHEET_HEIGHT, entry.contentRect.height));
    });

    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  const scale = zoom === "fit" ? fitScale : zoom;
  const steps = [0.5, 0.75, 1];

  return (
    <div data-print="shell" className="flex min-h-[60vh] min-w-0 flex-1 flex-col">
      <div
        data-print="hide"
        className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-rule bg-panel px-4"
      >
        <p className="truncate text-micro text-ink-soft">
          Preview updates as you type. Sample invoice, A4.
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            onClick={() => setZoom(Math.max(0.3, Math.round((scale - 0.1) * 100) / 100))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="tnum w-12 text-center text-[0.8125rem] text-ink-soft">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            onClick={() => setZoom(Math.min(2, Math.round((scale + 0.1) * 100) / 100))}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="ml-2 flex border border-rule">
            <button
              type="button"
              onClick={() => setZoom("fit")}
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
            {steps.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setZoom(step)}
                className={cn(
                  "tnum border-l border-rule px-2 py-1 text-[0.8125rem] transition-colors",
                  zoom === step
                    ? "bg-ink text-panel"
                    : "text-ink-soft hover:bg-panel-sunken",
                )}
              >
                {step * 100}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={stageRef}
        data-print="stage"
        className="stage-grid flex-1 overflow-auto bg-canvas p-12"
      >
        <div
          data-print="frame"
          style={{ height: sheetHeight * scale, width: SHEET_WIDTH * scale }}
          className="mx-auto"
        >
          <div
            ref={sheetRef}
            data-print="sheet"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: SHEET_WIDTH,
              boxShadow: "0 1px 0 rgba(0,0,0,.18), 0 24px 48px -24px rgba(0,0,0,.45)",
            }}
          >
            <InvoiceDocument config={config} invoice={sampleInvoice} />
          </div>
        </div>
      </div>
    </div>
  );
}
