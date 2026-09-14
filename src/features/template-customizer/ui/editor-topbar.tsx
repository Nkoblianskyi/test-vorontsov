"use client";

import * as React from "react";
import { Printer, Redo2, RotateCcw, Undo2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { useTemplateEditor } from "../model/use-template-editor";
import { ThemeToggle } from "./theme-toggle";

function formatSavedAt(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function EditorTopbar() {
  const { config, dirty, saving, savedAt, canUndo, canRedo, undo, redo, revert, save } =
    useTemplateEditor();

  return (
    <header
      data-print="hide"
      className="flex h-14 shrink-0 items-center justify-between gap-6 border-b border-rule-strong bg-panel px-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-7 w-2 shrink-0"
          style={{ background: config.brandColor }}
          aria-hidden
        />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {config.name || "Untitled template"}
          </h1>
          <p role="status" className="text-micro text-ink-faint">
            {dirty ? "Unsaved changes" : `Saved ${formatSavedAt(savedAt)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex border border-rule">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (⌘Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (⇧⌘Z)"
            className="border-l border-rule"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Button size="sm" variant="ghost" onClick={revert} disabled={!dirty}>
          <RotateCcw className="h-3.5 w-3.5" />
          Revert
        </Button>

        <ThemeToggle />

        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />
          Print or PDF
        </Button>

        <Button
          size="sm"
          variant={dirty ? "signal" : "solid"}
          onClick={save}
          disabled={saving || !dirty}
          className={cn(saving && "opacity-70")}
        >
          {saving ? "Saving" : "Save template"}
        </Button>
      </div>
    </header>
  );
}
