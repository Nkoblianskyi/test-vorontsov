"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

import { useCompanyStore } from "@/entities/company/model/store";
import { referenceSample } from "@/entities/invoice/model/samples";
import { InvoiceDocument } from "@/entities/invoice/ui/invoice-document";
import { ScaledSheet, SHEET_WIDTH } from "@/entities/invoice/ui/sheet";
import { useTemplatesStore } from "@/entities/template/model/store";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/ui/toast";
import { TemplateEditorProvider, useTemplateEditor } from "../../model/use-template-editor";
import { TemplateNotFound } from "../template-not-found";
import { ContentTab } from "./content-tab";
import { GeneralTab } from "./general-tab";
import { PaymentsDialog } from "./payments-dialog";
import { RefDialog } from "./primitives";
import styles from "./reference.module.css";

const TABS = [
  { value: "general", label: "General" },
  { value: "content", label: "Content" },
] as const;

/** A Swiss-grid template has A4 geometry: scale it to the preview width instead. */
function FitSheet({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.8);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / SHEET_WIDTH));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.fitSheet}>
      <ScaledSheet scale={scale}>{children}</ScaledSheet>
    </div>
  );
}

function ReferenceLayout() {
  const router = useRouter();
  const { config, tab, setTab, dirty, save } = useTemplateEditor();
  const company = useCompanyStore((state) => state.profile);
  const [paymentsOpen, setPaymentsOpen] = React.useState(false);
  const [discardOpen, setDiscardOpen] = React.useState(false);

  const { terms, statement } = config.content;
  const data = React.useMemo(
    () => ({ ...referenceSample(company), terms, statement }),
    [company, terms, statement],
  );

  const exit = React.useCallback(() => router.push("/templates"), [router]);
  const cancel = React.useCallback(
    () => (dirty ? setDiscardOpen(true) : exit()),
    [dirty, exit],
  );

  const onSave = async () => {
    if (await save()) {
      toast("Template saved", { tone: "positive", description: config.name });
      exit();
    }
  };

  // A drawer closes on Escape, like the one in the reference.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !paymentsOpen && !discardOpen) cancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancel, paymentsOpen, discardOpen]);

  return (
    <div className={styles.root}>
      <section className={styles.customize} aria-label="Customize template">
        <div className={styles.head}>
          <h2 className={styles.headTitle}>Customize</h2>
        </div>

        <div className={styles.body}>
          <div
            className={styles.tabs}
            role="tablist"
            aria-orientation="vertical"
            onKeyDown={(event) => {
              // Vertical tablist: arrows move between the tabs (ARIA tabs pattern).
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              const next = tab === "general" ? "content" : "general";
              setTab(next);
              document.getElementById(`rf-tab-${next}`)?.focus();
            }}
          >
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="tab"
                id={`rf-tab-${value}`}
                tabIndex={tab === value ? 0 : -1}
                aria-selected={tab === value}
                aria-controls="rf-panel"
                onClick={() => setTab(value)}
                className={cn(styles.tab, tab === value && styles.tabActive)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.panel}>
            <div
              className={styles.scroll}
              role="tabpanel"
              id="rf-panel"
              aria-labelledby={`rf-tab-${tab}`}
            >
              {tab === "general" ? (
                <GeneralTab onManagePayments={() => setPaymentsOpen(true)} />
              ) : (
                <ContentTab />
              )}
            </div>
            <div className={styles.footer}>
              <button
                type="button"
                className={cn(styles.btn, styles.btnCancel)}
                onClick={cancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cn(styles.btn, styles.btnPrimary)}
                onClick={onSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.preview} aria-label="Preview">
        <div className={styles.head}>
          <h2 className={styles.headTitle}>Preview</h2>
          <button
            type="button"
            className={styles.close}
            onClick={cancel}
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className={styles.previewBody}>
          {config.design === "classic" ? (
            <div className={styles.paper}>
              <InvoiceDocument config={config} data={data} fluid />
            </div>
          ) : (
            <FitSheet>
              <InvoiceDocument config={config} data={data} />
            </FitSheet>
          )}
        </div>
      </section>

      <PaymentsDialog open={paymentsOpen} onClose={() => setPaymentsOpen(false)} />

      <RefDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard changes?"
        footer={
          <>
            <button
              type="button"
              className={cn(styles.btn, styles.btnCancel)}
              onClick={() => setDiscardOpen(false)}
            >
              Keep editing
            </button>
            <button
              type="button"
              className={cn(styles.btn, styles.btnDanger)}
              onClick={exit}
            >
              Discard
            </button>
          </>
        }
      >
        <div className={styles.alert}>
          <AlertTriangle size={36} strokeWidth={1.5} />
          <p className={styles.alertText}>
            You have unsaved changes to this template. If you close the customizer now, they
            will be lost.
          </p>
        </div>
      </RefDialog>
    </div>
  );
}

/** The reference screen reproduced 1:1, wired to the same model as the Studio editor. */
export function ReferenceEditor({ templateId }: { templateId: string }) {
  const template = useTemplatesStore((state) =>
    state.templates.find((item) => item.id === templateId),
  );

  if (!template) return <TemplateNotFound />;

  return (
    <TemplateEditorProvider key={templateId} template={template}>
      <ReferenceLayout />
    </TemplateEditorProvider>
  );
}
