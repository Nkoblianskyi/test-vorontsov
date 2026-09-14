"use client";

import * as React from "react";

import type { InvoiceRecord } from "@/entities/invoice/model/schema";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import { useInvoiceEditor } from "@/features/invoice-editor/model/use-invoice-editor";
import { TemplateEditorProvider } from "@/features/template-editor/model/use-template-editor";
import { NotFoundScreen } from "@/shared/ui/not-found-screen";
import { ComposerLayout, type MobilePane } from "./composer-layout";
import type { InspectorPane } from "./inspector";

const composerRoute = (id: string) => `/vision/${id}`;
/** A unique query makes "New invoice" a fresh screen even when already on /vision. */
const newComposerRoute = () => `/vision?new=${Date.now()}`;

function ComposerScreen({ existing }: { existing: InvoiceRecord | null }) {
  const [pane, setPane] = React.useState<InspectorPane>("invoice");
  const [mobilePane, setMobilePane] = React.useState<MobilePane>("sheet");

  const showInvoicePanel = React.useCallback(() => {
    setPane("invoice");
    setMobilePane("invoice");
  }, []);

  const editor = useInvoiceEditor(existing, {
    onInvalid: showInvoicePanel,
    autosave: true,
    routeFor: composerRoute,
    homeHref: "/vision",
  });

  // The design panel edits the invoice's template: switching templates starts a
  // fresh template form, while the invoice form above it keeps its state.
  return (
    <TemplateEditorProvider
      key={editor.template.id}
      template={editor.template}
      keyboard={false}
    >
      <ComposerLayout
        editor={editor}
        pane={pane}
        onPaneChange={setPane}
        mobilePane={mobilePane}
        onMobilePaneChange={setMobilePane}
        newHref={newComposerRoute}
        hrefFor={composerRoute}
      />
    </TemplateEditorProvider>
  );
}

/**
 * Our vision of the service: one screen where the invoice is written on the
 * sheet itself, with the invoice form and the template design side by side,
 * autosave and a command palette.
 */
export function Composer({ invoiceId }: { invoiceId?: string }) {
  const existing = useInvoicesStore((state) =>
    invoiceId ? state.invoices.find((invoice) => invoice.id === invoiceId) : undefined,
  );
  // Deleting from this screen removes the record before the route changes.
  const [foundOnOpen] = React.useState(Boolean(existing));

  if (invoiceId && !existing) {
    if (foundOnOpen) return null;
    return (
      <NotFoundScreen
        title="Invoice not found"
        description="It was deleted, or the link points to an invoice that never existed."
        href="/vision"
        action="Open the composer"
      />
    );
  }

  return <ComposerScreen key={invoiceId ?? "new"} existing={existing ?? null} />;
}
