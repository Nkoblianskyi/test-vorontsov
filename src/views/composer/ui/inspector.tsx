"use client";

import { Copy } from "lucide-react";

import { toTemplateConfig } from "@/entities/template/model/schema";
import { useTemplatesStore } from "@/entities/template/model/store";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import type { InvoiceEditorApi } from "@/features/invoice-editor/model/use-invoice-editor";
import { AdjustmentsSection } from "@/features/invoice-editor/ui/adjustments-section";
import { CustomerSection } from "@/features/invoice-editor/ui/customer-section";
import { DetailsSection } from "@/features/invoice-editor/ui/details-section";
import { ItemsSection } from "@/features/invoice-editor/ui/items-section";
import { NotesSection } from "@/features/invoice-editor/ui/notes-section";
import {
  useTemplateEditor,
  type EditorTab,
} from "@/features/template-editor/model/use-template-editor";
import { ContentSection } from "@/features/template-editor/ui/studio/content-section";
import { GeneralSection } from "@/features/template-editor/ui/studio/general-section";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { toast } from "@/shared/ui/toast";
import type { TemplateSaveState } from "../model/use-template-autosave";

export type InspectorPane = "invoice" | "design";

const templateStatus: Record<TemplateSaveState, string> = {
  saved: "Saved",
  saving: "Saving…",
  invalid: "Not saved: a setting needs attention",
};

function InvoicePane({
  editor,
  onDesign,
}: {
  editor: InvoiceEditorApi;
  onDesign: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 space-y-9 overflow-y-auto px-4 pt-6 pb-16 sm:px-5">
      <CustomerSection editor={editor} />
      <DetailsSection editor={editor} onCustomizeTemplate={onDesign} />
      <ItemsSection
        form={editor.form}
        currency={editor.values.currency}
        lines={editor.totals.lines}
      />
      <AdjustmentsSection editor={editor} />
      <NotesSection editor={editor} />
    </div>
  );
}

/** Design panel: the Studio controls, applied to this invoice's template. */
function DesignPane({
  editor,
  templateState,
}: {
  editor: InvoiceEditorApi;
  templateState: TemplateSaveState;
}) {
  const { templateId, tab, setTab, save } = useTemplateEditor();
  const usage = useInvoicesStore(
    (state) => state.invoices.filter((invoice) => invoice.templateId === templateId).length,
  );

  /** A client-specific look without touching the shared template. */
  const copyForThisInvoice = async () => {
    await save({ silent: true });
    const store = useTemplatesStore.getState();
    const copy = store.duplicate(templateId);
    if (!copy) return;
    const client = editor.values.customer.name.trim();
    const name = `${editor.template.name} · ${client || "copy"}`.slice(0, 60);
    store.update(copy.id, { ...toTemplateConfig(copy), name });
    editor.changeTemplate(copy.id);
    toast("Template copied", { description: `Only this invoice uses “${name}” for now.` });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b border-rule bg-panel-sunken px-4 py-3 sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium">{editor.template.name}</p>
          <p
            role="status"
            className={cn(
              "shrink-0 text-micro",
              templateState === "invalid" ? "text-signal" : "text-ink-faint",
            )}
          >
            {templateStatus[templateState]}
          </p>
        </div>
        <p className="text-micro leading-relaxed text-ink-soft">
          {usage > 1
            ? `Shared by ${usage} invoices: changes here restyle all of them.`
            : "Only this invoice uses this template."}
        </p>
        {usage > 1 ? (
          <Button size="sm" onClick={() => void copyForThisInvoice()}>
            <Copy className="h-3.5 w-3.5" />
            Make a copy for this invoice
          </Button>
        ) : null}
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as EditorTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList>
          <TabsTrigger value="general">Look</TabsTrigger>
          <TabsTrigger value="content">Wording</TabsTrigger>
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-16 sm:px-5">
          <TabsContent value="general" className="focus-visible:outline-none">
            <GeneralSection />
          </TabsContent>
          <TabsContent value="content" className="focus-visible:outline-none">
            <ContentSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

const PANES: { value: InspectorPane; label: string }[] = [
  { value: "invoice", label: "Invoice" },
  { value: "design", label: "Design" },
];

export function Inspector({
  editor,
  pane,
  onPaneChange,
  templateState,
  className,
}: {
  editor: InvoiceEditorApi;
  pane: InspectorPane;
  onPaneChange: (pane: InspectorPane) => void;
  templateState: TemplateSaveState;
  className?: string;
}) {
  return (
    <aside
      data-print="hide"
      aria-label="Inspector"
      className={cn(
        "min-h-0 shrink-0 flex-col border-rule-strong bg-panel lg:border-l",
        className,
      )}
    >
      {/* Desktop switch; on phones the pane bar above the canvas does this. */}
      <div
        role="group"
        aria-label="Inspector panel"
        className="hidden border-b border-rule lg:flex"
      >
        {PANES.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={pane === item.value}
            onClick={() => onPaneChange(item.value)}
            className={cn(
              "relative -mb-px flex-1 border-b-2 px-4 py-3 text-sm transition-colors",
              pane === item.value
                ? "border-ink font-medium text-ink"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {pane === "invoice" ? (
        <InvoicePane editor={editor} onDesign={() => onPaneChange("design")} />
      ) : (
        <DesignPane editor={editor} templateState={templateState} />
      )}
    </aside>
  );
}
