"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Redo2, RotateCcw, Undo2 } from "lucide-react";

import { useTemplatesStore } from "@/entities/template/model/store";
import { InvoiceDocument } from "@/entities/invoice/ui/invoice-document";
import { MobilePreviewBar, MobilePreviewSheet } from "@/entities/invoice/ui/mobile-preview";
import { PreviewStage } from "@/entities/invoice/ui/preview-stage";
import { Button } from "@/shared/ui/button";
import { Listbox } from "@/shared/ui/listbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { requestConfirm } from "@/shared/ui/confirm";
import { toast } from "@/shared/ui/toast";
import { focusField } from "@/shared/lib/focus-field";
import { formatTimestamp } from "@/shared/lib/format";

import {
  TemplateEditorProvider,
  useTemplateEditor,
  type EditorTab,
} from "../../model/use-template-editor";
import {
  usePreviewData,
  usePreviewOptions,
  type PreviewSource,
} from "../../model/use-preview-data";
import { TemplateNotFound } from "../template-not-found";
import { GeneralSection } from "./general-section";
import { ContentSection } from "./content-section";

type Target = { tab: EditorTab; id: string };

const pickTargets: Record<string, Target> = {
  title: { tab: "content", id: "document-title" },
  logo: { tab: "general", id: "section-logo" },
  payment: { tab: "general", id: "section-payments" },
  terms: { tab: "content", id: "default-terms" },
  statement: { tab: "content", id: "default-statement" },
  "meta.number": { tab: "content", id: "field-row-invoiceNumber" },
  "meta.issueDate": { tab: "content", id: "field-row-issueDate" },
  "meta.dueDate": { tab: "content", id: "field-row-dueDate" },
  "meta.reference": { tab: "content", id: "field-row-reference" },
  seller: { tab: "content", id: "field-row-companyAddress" },
  labels: { tab: "content", id: "field-row-itemName" },
  subtotal: { tab: "content", id: "field-row-subtotal" },
  discount: { tab: "content", id: "field-row-discount" },
  total: { tab: "content", id: "field-row-total" },
  paid: { tab: "content", id: "field-row-paymentMade" },
  balance: { tab: "content", id: "field-row-balanceDue" },
  footer: { tab: "content", id: "field-row-pageFooter" },
};

/** In a template, a click on the sheet leads to the setting that shapes that spot. */
function studioTarget(key: string): Target | null {
  if (pickTargets[key]) return pickTargets[key];
  if (key.startsWith("buyer")) return { tab: "content", id: "field-row-billedTo" };
  if (key.startsWith("tax.")) return { tab: "content", id: "field-row-taxes" };
  const item = /^item\.\d+\.(\w+)$/.exec(key);
  if (item) {
    const rows: Record<string, string> = {
      name: "field-row-itemName",
      description: "field-row-itemDescription",
      quantity: "field-row-itemQuantity",
      rate: "field-row-itemRate",
    };
    return { tab: "content", id: rows[item[1]] ?? "field-row-itemName" };
  }
  return null;
}

function useLeaveGuard() {
  const router = useRouter();
  const { dirty } = useTemplateEditor();

  return React.useCallback(
    async (href: string) => {
      if (dirty) {
        const leave = await requestConfirm({
          title: "Leave without saving?",
          description: "Your changes to this template will be lost.",
          confirmLabel: "Discard changes",
          tone: "danger",
        });
        if (!leave) return;
      }
      router.push(href);
    },
    [dirty, router],
  );
}

function StudioTopbar() {
  const { templateId, config, dirty, savedAt, canUndo, canRedo, undo, redo, revert, save } =
    useTemplateEditor();
  const leave = useLeaveGuard();

  const onSave = async () => {
    if (await save())
      toast("Template saved", { tone: "positive", description: config.name });
  };

  return (
    <header
      data-print="hide"
      className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-rule-strong bg-panel px-2 sm:px-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => leave("/templates")}
          aria-label="Back to templates"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span
          className="h-7 w-1.5 shrink-0"
          style={{ background: config.primaryColor }}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {config.name?.trim() || "Untitled template"}
          </p>
          <p role="status" className="truncate text-micro text-ink-faint">
            {dirty ? (
              <span className="text-signal">Unsaved changes</span>
            ) : (
              `Saved ${formatTimestamp(savedAt)}`
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden border border-rule sm:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
            className="border-l border-rule"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="hidden xl:inline-flex"
          onClick={() => leave(`/templates/${templateId}/reference`)}
          title="Open the same template in the 1:1 reference editor"
        >
          Reference layout
        </Button>

        <ThemeToggle className="hidden sm:inline-flex" />

        <Button
          size="sm"
          variant="ghost"
          className="hidden md:inline-flex"
          onClick={() => window.print()}
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </Button>

        {dirty ? (
          <Button size="sm" variant="ghost" onClick={revert} aria-label="Discard changes">
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Discard</span>
          </Button>
        ) : null}

        <Button
          size="sm"
          variant={dirty ? "signal" : "solid"}
          onClick={onSave}
          disabled={!dirty}
          title="Save (Ctrl+S)"
        >
          Save
        </Button>
      </div>
    </header>
  );
}

function PreviewSourcePicker({
  value,
  onChange,
}: {
  value: PreviewSource;
  onChange: (value: PreviewSource) => void;
}) {
  const options = usePreviewOptions();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden text-micro text-ink-soft sm:inline">Preview with</span>
      <Listbox
        size="sm"
        aria-label="Preview with"
        value={value}
        onChange={onChange}
        className="w-[17rem] max-w-[46vw]"
        options={[
          {
            value: "sample-detailed",
            label: "Sample · three lines, discount",
            group: "Samples",
          },
          {
            value: "sample-short",
            label: "Sample · one line, as in the reference",
            group: "Samples",
          },
          ...options.map((option) => ({ ...option, group: "Your invoices" })),
        ]}
      />
    </div>
  );
}

function StudioLayout() {
  const { config, tab, setTab } = useTemplateEditor();
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [source, setSource] = React.useState<PreviewSource>("sample-detailed");
  const data = usePreviewData(source, config);
  const closePreview = React.useCallback(() => setPreviewOpen(false), []);

  const onPick = (key: string) => {
    const target = studioTarget(key);
    if (!target) return;
    const wait = previewOpen || tab !== target.tab;
    setPreviewOpen(false);
    setTab(target.tab);
    window.setTimeout(() => focusField(target.id), wait ? 220 : 0);
  };

  const sheet = <InvoiceDocument config={config} data={data} />;
  const picker = <PreviewSourcePicker value={source} onChange={setSource} />;

  return (
    <div data-print="shell" className="flex h-dvh flex-col overflow-clip">
      <StudioTopbar />

      <div data-print="shell" className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          data-print="hide"
          className="flex min-h-0 w-full flex-1 flex-col bg-panel lg:w-[400px] lg:flex-none lg:border-r lg:border-rule-strong"
        >
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as EditorTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-28 sm:px-5 lg:pb-6">
              <TabsContent value="general" className="focus-visible:outline-none">
                <GeneralSection />
              </TabsContent>
              <TabsContent value="content" className="focus-visible:outline-none">
                <ContentSection />
              </TabsContent>
            </div>
          </Tabs>
          <div
            className="hidden h-1.5 shrink-0 transition-colors lg:block"
            style={{ background: config.primaryColor }}
            aria-hidden
          />
        </aside>

        <PreviewStage className="hidden lg:flex" toolbar={picker} onPick={onPick}>
          {sheet}
        </PreviewStage>
      </div>

      <MobilePreviewBar onOpen={() => setPreviewOpen(true)}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-8 w-1.5 shrink-0"
            style={{ background: config.primaryColor }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="field-label">Live preview</p>
            <p className="truncate text-sm font-medium">
              {config.name?.trim() || "Untitled template"}
            </p>
          </div>
        </div>
      </MobilePreviewBar>

      <MobilePreviewSheet
        open={previewOpen}
        onClose={closePreview}
        title={
          <>
            <p className="truncate text-sm font-semibold">
              {config.name?.trim() || "Untitled template"}
            </p>
            <p className="truncate text-micro text-ink-faint">
              Tap the sheet to find its setting
            </p>
          </>
        }
      >
        <PreviewStage toolbar={picker} onPick={onPick}>
          {sheet}
        </PreviewStage>
      </MobilePreviewSheet>
    </div>
  );
}

/** Our own take on the reference screen: same tabs, fields and flow, different visual system. */
export function StudioEditor({ templateId }: { templateId: string }) {
  const template = useTemplatesStore((state) =>
    state.templates.find((item) => item.id === templateId),
  );

  if (!template) return <TemplateNotFound />;

  return (
    <TemplateEditorProvider key={templateId} template={template}>
      <StudioLayout />
    </TemplateEditorProvider>
  );
}
