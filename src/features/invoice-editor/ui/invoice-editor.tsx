"use client";

import * as React from "react";

import { useCompanyStore } from "@/entities/company/model/store";
import { toDocumentData } from "@/entities/invoice/model/document";
import type { InvoiceRecord } from "@/entities/invoice/model/schema";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import { InvoiceDocument } from "@/entities/invoice/ui/invoice-document";
import { MobilePreviewBar, MobilePreviewSheet } from "@/entities/invoice/ui/mobile-preview";
import { PreviewStage } from "@/entities/invoice/ui/preview-stage";
import { focusField } from "@/shared/lib/focus-field";
import { formatMoney } from "@/shared/lib/format";
import { requestConfirm } from "@/shared/ui/confirm";
import { NotFoundScreen } from "@/shared/ui/not-found-screen";
import { resolveEditTarget } from "../lib/edit-targets";
import { useInvoiceEditor } from "../model/use-invoice-editor";
import { AdjustmentsSection } from "./adjustments-section";
import { CustomerSection } from "./customer-section";
import { DetailsSection } from "./details-section";
import { EditorTopbar } from "./editor-topbar";
import { ItemsSection } from "./items-section";
import { NotesSection } from "./notes-section";
import { PreviewEditPopover, type InlineTarget } from "./preview-edit";

/** Time for the mobile preview to close before scrolling the form under it. */
const SHEET_CLOSE_DELAY = 220;

function InvoiceEditorScreen({ existing }: { existing: InvoiceRecord | null }) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [inline, setInline] = React.useState<InlineTarget | null>(null);

  const closePreview = React.useCallback(() => {
    setPreviewOpen(false);
    setInline(null);
  }, []);

  const editor = useInvoiceEditor(existing, { onInvalid: closePreview });
  const { form, values, template, totals, leave, commit, templateEditorHref } = editor;
  const company = useCompanyStore((state) => state.profile);
  const data = React.useMemo(
    () => toDocumentData(values, company, { placeholders: true }),
    [values, company],
  );

  const showInForm = (fieldId: string, openPicker = false) => {
    const delay = previewOpen ? SHEET_CLOSE_DELAY : 0;
    closePreview();
    window.setTimeout(() => focusField(fieldId, { click: openPicker }), delay);
  };

  /** A click on the sheet: edit in place, jump to the field, or offer the right screen. */
  const onPick = (key: string, anchor: HTMLElement) => {
    const spec = resolveEditTarget(key, values.currency);
    if (!spec) return;

    if (spec.kind === "field") return setInline({ spec, anchor });
    if (spec.kind === "jump") return showInForm(spec.fieldId, spec.openPicker);

    void (async () => {
      const confirmed = await requestConfirm(
        spec.kind === "company"
          ? {
              title: "Company details live in Settings",
              description:
                "Your name and address print on every invoice, so they are edited once, in Settings.",
              confirmLabel: "Open Settings",
            }
          : {
              title: `${spec.label} comes from the template`,
              description: `It is part of “${template.name}”. Changing it there updates every invoice that uses the template.`,
              confirmLabel: "Customize template",
            },
      );
      if (!confirmed) return;
      closePreview();
      void leave(spec.kind === "company" ? "/settings" : templateEditorHref);
    })();
  };

  const sheet = <InvoiceDocument config={template} data={data} />;
  const caption = (
    <p className="truncate text-micro text-ink-soft">
      <span className="font-medium text-ink">{template.name}</span>
      <span className="hidden sm:inline"> · click anything on the sheet to edit it</span>
    </p>
  );

  return (
    <div data-print="shell" className="flex h-dvh flex-col overflow-clip">
      <EditorTopbar editor={editor} />

      <div data-print="shell" className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <form
          data-print="hide"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void commit(null);
          }}
          className="min-h-0 w-full flex-1 overflow-y-auto bg-panel lg:w-[500px] lg:flex-none lg:border-r lg:border-rule-strong xl:w-[540px]"
        >
          <div className="space-y-9 px-4 pt-6 pb-28 sm:px-6 lg:pb-8">
            <CustomerSection editor={editor} />
            <DetailsSection editor={editor} />
            <ItemsSection form={form} currency={values.currency} lines={totals.lines} />
            <AdjustmentsSection editor={editor} />
            <NotesSection editor={editor} />
          </div>
        </form>

        <PreviewStage className="hidden lg:flex" toolbar={caption} onPick={onPick}>
          {sheet}
        </PreviewStage>
      </div>

      <MobilePreviewBar onOpen={() => setPreviewOpen(true)}>
        <p className="field-label">Balance due</p>
        <p className="tnum truncate text-base font-semibold tracking-tight">
          {formatMoney(totals.balance, values.currency)}
        </p>
      </MobilePreviewBar>

      <MobilePreviewSheet
        open={previewOpen}
        onClose={closePreview}
        title={
          <>
            <p className="tnum truncate text-sm font-semibold">{values.number}</p>
            <p className="truncate text-micro text-ink-faint">
              Tap anything on the sheet to edit it
            </p>
          </>
        }
      >
        <PreviewStage toolbar={caption} onPick={onPick}>
          {sheet}
        </PreviewStage>
      </MobilePreviewSheet>

      <PreviewEditPopover
        target={inline}
        form={form}
        onClose={() => setInline(null)}
        onShowInForm={(fieldId) => showInForm(fieldId)}
      />
    </div>
  );
}

/** The generator: a form on the left, the real sheet on the right, both always in sync. */
export function InvoiceEditor({ invoiceId }: { invoiceId?: string }) {
  const existing = useInvoicesStore((state) =>
    invoiceId ? state.invoices.find((invoice) => invoice.id === invoiceId) : undefined,
  );
  // Deleting from this screen removes the record before the route changes:
  // render nothing then, rather than flashing "not found".
  const [foundOnOpen] = React.useState(Boolean(existing));

  if (invoiceId && !existing) {
    if (foundOnOpen) return null;
    return (
      <NotFoundScreen
        title="Invoice not found"
        description="It was deleted, or the link points to an invoice that never existed."
        href="/invoices"
        action="Back to invoices"
      />
    );
  }

  return <InvoiceEditorScreen key={invoiceId ?? "new"} existing={existing ?? null} />;
}
