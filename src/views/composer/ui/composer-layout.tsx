"use client";

import * as React from "react";
import type { Path, PathValue } from "react-hook-form";

import { useCompanyStore } from "@/entities/company/model/store";
import { toDocumentData } from "@/entities/invoice/model/document";
import type { InvoiceInput } from "@/entities/invoice/model/schema";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import { InvoiceDocument } from "@/entities/invoice/ui/invoice-document";
import { PreviewStage } from "@/entities/invoice/ui/preview-stage";
import { templatePresets } from "@/entities/template/model/presets";
import { useTemplatesStore } from "@/entities/template/model/store";
import { itemFieldId, newLineItem } from "@/features/invoice-editor/lib/line-item";
import type { InvoiceEditorApi } from "@/features/invoice-editor/model/use-invoice-editor";
import { useTemplateEditor } from "@/features/template-editor/model/use-template-editor";
import { cn } from "@/shared/lib/cn";
import { focusField } from "@/shared/lib/focus-field";
import { CommandPalette, type Command } from "@/shared/ui/command-palette";
import { requestConfirm } from "@/shared/ui/confirm";
import { Segmented } from "@/shared/ui/segmented";
import { isInlineTarget, resolveComposerTarget } from "../lib/targets";
import { useTemplateAutosave } from "../model/use-template-autosave";
import { ComposerTopbar } from "./composer-topbar";
import {
  InlineSheetEditor,
  measureOnSheet,
  type InlineField,
  type InlineSession,
} from "./inline-sheet-editor";
import { Inspector, type InspectorPane } from "./inspector";
import { InvoiceRail } from "./invoice-rail";

/** Time for a pane switch to render before focusing a control in it. */
const REVEAL_DELAY = 160;

export type MobilePane = "sheet" | "invoice" | "design";

const numberFrom = (text: string) =>
  text.trim() === "" ? Number.NaN : Number(text.replace(",", "."));

function useModKey() {
  const [modKey] = React.useState(() =>
    /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl ",
  );
  return modKey;
}

export function ComposerLayout({
  editor,
  pane,
  onPaneChange,
  mobilePane,
  onMobilePaneChange,
  newHref,
  hrefFor,
}: {
  editor: InvoiceEditorApi;
  pane: InspectorPane;
  onPaneChange: (pane: InspectorPane) => void;
  mobilePane: MobilePane;
  onMobilePaneChange: (pane: MobilePane) => void;
  newHref: () => string;
  hrefFor: (id: string) => string;
}) {
  const template = useTemplateEditor();
  const templateState = useTemplateAutosave();
  const company = useCompanyStore((state) => state.profile);
  const invoices = useInvoicesStore((state) => state.invoices);
  const templates = useTemplatesStore((state) => state.templates);
  const modKey = useModKey();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [session, setSession] = React.useState<InlineSession | null>(null);

  const { form, values, record } = editor;
  const data = React.useMemo(
    () => toDocumentData(values, company, { placeholders: true }),
    [values, company],
  );

  // --- in-place editing ------------------------------------------------------------

  const inlineField = (key: string): InlineField | null => {
    const target = resolveComposerTarget(key, values.currency);
    if (!isInlineTarget(target)) return null;

    if (target?.kind === "template-title") {
      return {
        key,
        label: "Document title",
        input: "text",
        read: () => template.form.getValues("content.documentTitle"),
        write: (value) =>
          template.form.setValue("content.documentTitle", value, {
            shouldDirty: true,
            shouldValidate: true,
          }),
      };
    }
    if (target?.kind !== "invoice-field") return null;

    const { spec } = target;
    const path = spec.path as Path<InvoiceInput>;
    return {
      key,
      label: spec.label,
      input: spec.input,
      read: () => {
        const value: unknown = form.getValues(path);
        if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
        return String(value ?? "");
      },
      write: (text) =>
        form.setValue(
          path,
          (spec.input === "number" ? numberFrom(text) : text) as PathValue<
            InvoiceInput,
            typeof path
          >,
          { shouldDirty: true, shouldValidate: true },
        ),
    };
  };

  const openInline = (anchor: HTMLElement): boolean => {
    const field = inlineField(anchor.dataset.edit ?? "");
    const measured = measureOnSheet(anchor);
    if (!field || !measured) return false;
    setSession({ field, ...measured });
    return true;
  };

  /** Tab walks the editable spots of the sheet in reading order. */
  const moveInline = (direction: 1 | -1) => {
    if (!session) return;
    const spots = [...session.sheet.querySelectorAll<HTMLElement>("[data-edit]")].filter(
      (element, index, all) =>
        inlineField(element.dataset.edit ?? "") &&
        all.findIndex((other) => other.dataset.edit === element.dataset.edit) === index,
    );
    const current = spots.findIndex(
      (element) => element.dataset.edit === session.field.key,
    );
    const next = spots[current + direction];
    if (!next || !openInline(next)) setSession(null);
  };

  // --- panels ------------------------------------------------------------------------

  const reveal = (target: InspectorPane, fieldId: string, click = false) => {
    setSession(null);
    onPaneChange(target);
    onMobilePaneChange(target);
    window.setTimeout(() => focusField(fieldId, { click }), REVEAL_DELAY);
  };

  const onPick = (key: string, anchor: HTMLElement) => {
    if (openInline(anchor)) return;
    const target = resolveComposerTarget(key, values.currency);
    if (!target) return;

    if (target.kind === "invoice-control") {
      reveal("invoice", target.fieldId, target.openPicker);
    } else if (target.kind === "design") {
      template.setTab(target.target.tab);
      reveal("design", target.target.id);
    } else if (target.kind === "company") {
      void requestConfirm({
        title: "Company details live in Settings",
        description:
          "Your name and address print on every invoice, so they are edited once, in Settings.",
        confirmLabel: "Open Settings",
      }).then((confirmed) => {
        if (confirmed) void editor.leave("/settings");
      });
    }
  };

  const addLine = () => {
    const index = form.getValues("items").length;
    form.setValue("items", [...form.getValues("items"), newLineItem()], {
      shouldDirty: true,
    });
    reveal("invoice", itemFieldId(index, "name"));
  };

  // --- commands ------------------------------------------------------------------------

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const draft = !record || record.status === "draft";
  const commands: Command[] = [
    {
      id: "new",
      group: "Invoice",
      label: "New invoice",
      run: () => editor.leave(newHref()),
    },
    draft
      ? {
          id: "send",
          group: "Invoice",
          label: "Mark as sent",
          run: () => editor.commit("sent"),
        }
      : {
          id: "paid",
          group: "Invoice",
          label: "Mark as paid",
          keywords: "settle payment",
          run: editor.markPaid,
        },
    { id: "line", group: "Invoice", label: "Add a line", keywords: "item", run: addLine },
    {
      id: "customer",
      group: "Invoice",
      label: "Edit customer",
      keywords: "client billed to",
      run: () => reveal("invoice", "customer-name"),
    },
    {
      id: "print",
      group: "Invoice",
      label: "Print or save as PDF",
      keywords: "download",
      run: () => window.print(),
    },
    ...(record
      ? [
          {
            id: "duplicate",
            group: "Invoice",
            label: "Duplicate invoice",
            keywords: "copy",
            run: () => void editor.duplicate(),
          },
          {
            id: "delete",
            group: "Invoice",
            label: "Delete invoice",
            keywords: "remove",
            run: () => void editor.remove(),
          },
        ]
      : []),
    ...templates.map((item) => ({
      id: `template-${item.id}`,
      group: "Template",
      label: `Use “${item.name}”`,
      hint: item.id === editor.template.id ? "Current" : undefined,
      keywords: "switch template",
      run: () => editor.changeTemplate(item.id),
    })),
    ...templatePresets.map((preset) => ({
      id: `preset-${preset.id}`,
      group: "Design",
      label: `Apply preset: ${preset.name}`,
      hint: preset.description,
      keywords: "look style",
      run: () => template.applyPreset(preset),
    })),
    ...[...invoices]
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
      .map((invoice) => ({
        id: `go-${invoice.id}`,
        group: "Go to",
        label: `${invoice.number} · ${invoice.customer.name}`,
        keywords: "open invoice",
        run: () => editor.leave(hrefFor(invoice.id)),
      })),
    {
      id: "go-list",
      group: "Go to",
      label: "Invoice list",
      run: () => editor.leave("/invoices"),
    },
    {
      id: "go-templates",
      group: "Go to",
      label: "Templates",
      run: () => editor.leave("/templates"),
    },
    {
      id: "go-settings",
      group: "Go to",
      label: "Settings",
      run: () => editor.leave("/settings"),
    },
  ];

  const sheet = <InvoiceDocument config={template.config} data={data} />;
  const hint = (
    <p className="truncate text-micro text-ink-soft">
      <span className="font-medium text-ink">Click any text to edit it</span>
      <span className="hidden sm:inline">
        {" "}
        · Tab moves on · Esc undoes · {modKey}K for everything
      </span>
    </p>
  );

  return (
    <div data-print="shell" className="flex h-dvh flex-col overflow-clip bg-canvas">
      <ComposerTopbar
        editor={editor}
        modKey={modKey}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <div data-print="hide" className="border-b border-rule bg-panel px-3 py-2 lg:hidden">
        <Segmented
          name="Composer panel"
          value={mobilePane}
          onChange={(next) => {
            setSession(null);
            onMobilePaneChange(next);
            if (next !== "sheet") onPaneChange(next);
          }}
          options={[
            { value: "sheet", label: "Sheet" },
            { value: "invoice", label: "Invoice" },
            { value: "design", label: "Design" },
          ]}
        />
      </div>

      <div data-print="shell" className="flex min-h-0 flex-1">
        <InvoiceRail
          className="hidden xl:flex"
          currentId={record?.id}
          onOpen={(id) => void editor.leave(hrefFor(id))}
          onNew={() => void editor.leave(newHref())}
        />
        <PreviewStage
          className={cn(mobilePane === "sheet" ? "flex" : "hidden", "lg:flex")}
          toolbar={hint}
          onPick={onPick}
        >
          {sheet}
        </PreviewStage>
        <Inspector
          className={cn(
            mobilePane === "sheet" ? "hidden" : "flex",
            "w-full lg:flex lg:w-[400px]",
          )}
          editor={editor}
          pane={pane}
          onPaneChange={(next) => {
            onPaneChange(next);
            onMobilePaneChange(next);
          }}
          templateState={templateState}
        />
      </div>

      <InlineSheetEditor
        session={session}
        onClose={() => setSession(null)}
        onMove={moveInline}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
}
