"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CreditCard, Landmark, Wallet, X, type LucideIcon } from "lucide-react";
import { Controller, useWatch, type FieldPath } from "react-hook-form";

import { useCompanyStore } from "@/entities/company/model/store";
import { referenceSample } from "@/entities/invoice/model/samples";
import { InvoiceDocument } from "@/entities/invoice/ui/invoice-document";
import { ScaledSheet, SHEET_WIDTH } from "@/entities/invoice/ui/sheet";
import { contentFieldGroups, type ContentFieldMeta } from "@/entities/template/model/content-fields";
import type { TemplateConfig } from "@/entities/template/model/schema";
import { useTemplatesStore } from "@/entities/template/model/store";
import { LogoMark } from "@/entities/template/ui/logo-mark";
import { cn } from "@/shared/lib/cn";
import { normalizeHex } from "@/shared/lib/color";
import { dateFormatOptions } from "@/shared/lib/format";
import { todayIso } from "@/shared/lib/dates";
import { Listbox, type ListboxSkin } from "@/shared/ui/listbox";
import { toast } from "@/shared/ui/toast";

import { TemplateEditorProvider, useTemplateEditor } from "../../model/use-template-editor";
import { readLogoFile } from "../../lib/read-logo";
import { TemplateNotFound } from "../template-not-found";
import styles from "./reference.module.css";

/** The shared listbox, dressed as a Blueprint-style select and menu. */
const referenceSkin: ListboxSkin = {
  trigger: `${styles.select} ${styles.selectTrigger}`,
  menu: styles.menu,
  option: styles.menuOption,
  optionActive: styles.menuOptionActive,
  optionSelected: styles.menuOptionSelected,
  group: styles.menuGroup,
  description: styles.menuDescription,
  showCheck: false,
};

/* ------------------------------------------------------------------ primitives */

function RefSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={styles.switchRow}
    >
      <span className={styles.track} aria-hidden />
      <span>{label}</span>
    </button>
  );
}

function RefDialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open ? (
        <>
          <div className={styles.dialogHead}>
            <h3 className={styles.dialogTitle}>{title}</h3>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
          <div className={styles.dialogBody}>{children}</div>
          {footer ? <div className={styles.dialogFoot}>{footer}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = React.useId();
  const [draft, setDraft] = React.useState(value);
  const [lastValue, setLastValue] = React.useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const commit = () => {
    const hex = normalizeHex(draft);
    if (hex) onChange(hex);
    else setDraft(value);
  };

  return (
    <div className={styles.colorRow}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.colorInput}>
        <label className={styles.swatch} style={{ background: value }}>
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${label} picker`}
          />
        </label>
        <input
          id={id}
          className={styles.hex}
          value={draft}
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ general tab */

function LogoBox() {
  const { form, config } = useTemplateEditor();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);

  const read = async (file: File | undefined) => {
    if (!file) return;
    const result = await readLogoFile(file);
    if (!result.ok) {
      setProblem(result.message);
      return;
    }
    setProblem(null);
    form.setValue("logo.src", result.src, { shouldDirty: true });
  };

  return (
    <div className={styles.logoWrap}>
      <button
        type="button"
        className={cn(styles.logoBox, dragging && styles.logoBoxDragging)}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void read(event.dataTransfer.files?.[0]);
        }}
        title="Click or drop an image to replace the logo"
        aria-label="Upload company logo"
      >
        <LogoMark
          logo={{ ...config.logo, show: true, shape: config.logo.shape === "circle" ? "circle" : "square" }}
          color={config.primaryColor}
          box="86px"
        />
      </button>
      {config.logo.src ? (
        <div className={styles.logoActions}>
          <button
            type="button"
            className={styles.logoAction}
            onClick={() => form.setValue("logo.src", null, { shouldDirty: true })}
          >
            Remove
          </button>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={(event) => {
          void read(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {problem ? <p className={styles.error}>{problem}</p> : null}
    </div>
  );
}

function GeneralTab({ onManagePayments }: { onManagePayments: () => void }) {
  const { form, config } = useTemplateEditor();
  const enabledMethods = [
    config.payments.bankTransfer.enabled,
    config.payments.card.enabled,
    config.payments.paypal.enabled,
  ].filter(Boolean).length;
  const paymentError = Boolean(form.formState.errors.payments);

  return (
    <>
      <h3 className={styles.sectionTitle}>General Branding</h3>
      <p className={styles.sectionDesc}>
        Set your company logo and branding colors to be automatically applied to your invoices.
      </p>

      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <div className={styles.group}>
            <label htmlFor="rf-name" className={styles.label}>
              Template Name <span className={styles.required}>*</span>
            </label>
            <input
              id="rf-name"
              {...field}
              aria-invalid={Boolean(fieldState.error)}
              className={cn(styles.input, fieldState.error && styles.invalid)}
            />
            {fieldState.error ? <p className={styles.error}>{fieldState.error.message}</p> : null}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="primaryColor"
        render={({ field }) => <ColorRow label="Primary Color" value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={form.control}
        name="secondaryColor"
        render={({ field }) => (
          <ColorRow label="Secondary Color" value={field.value} onChange={field.onChange} />
        )}
      />

      <div className={styles.logoGroup}>
        <p className={styles.label}>Logo</p>
        <Controller
          control={form.control}
          name="logo.show"
          render={({ field }) => (
            <RefSwitch
              checked={field.value}
              onChange={field.onChange}
              label="Display company logo in the paper"
            />
          )}
        />
        {config.logo.show ? <LogoBox /> : null}
      </div>

      <div className={styles.paymentBox}>
        <CreditCard size={14} strokeWidth={2} />
        <span>Accept payment methods</span>
        {enabledMethods || paymentError ? (
          <span className={paymentError ? styles.error : styles.paymentMeta} style={{ margin: 0 }}>
            {paymentError ? "Needs details" : `${enabledMethods} on`}
          </span>
        ) : null}
        <button type="button" className={styles.link} onClick={onManagePayments}>
          Manage
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ content tab */

function FieldRow({ meta }: { meta: ContentFieldMeta }) {
  const { form } = useTemplateEditor();
  const show = useWatch({ control: form.control, name: `content.fields.${meta.key}.show` as const });

  return (
    <div className={styles.fieldRow}>
      <Controller
        control={form.control}
        name={`content.fields.${meta.key}.show` as const}
        render={({ field }) => (
          <RefSwitch
            checked={meta.locked ? true : field.value}
            onChange={field.onChange}
            label={meta.title}
            disabled={meta.locked}
          />
        )}
      />
      {meta.labelEditable ? (
        <Controller
          control={form.control}
          name={`content.fields.${meta.key}.label` as const}
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                disabled={!show}
                placeholder={meta.placeholder ?? meta.title}
                aria-label={`${meta.title} label`}
                className={cn(styles.input, fieldState.error && styles.invalid)}
              />
              {fieldState.error ? <p className={styles.error}>{fieldState.error.message}</p> : null}
            </>
          )}
        />
      ) : null}
    </div>
  );
}

function ContentTab() {
  const { form } = useTemplateEditor();

  return (
    <>
      <h3 className={styles.sectionTitle}>Content</h3>
      <p className={styles.sectionDesc}>
        Choose which details appear in the paper and rename their labels.
      </p>

      <Controller
        control={form.control}
        name="content.documentTitle"
        render={({ field, fieldState }) => (
          <div className={styles.group}>
            <label htmlFor="rf-title" className={styles.label}>
              Document Title <span className={styles.required}>*</span>
            </label>
            <input
              id="rf-title"
              {...field}
              maxLength={28}
              className={cn(styles.input, fieldState.error && styles.invalid)}
            />
            {fieldState.error ? <p className={styles.error}>{fieldState.error.message}</p> : null}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="content.dateFormat"
        render={({ field }) => (
          <div className={styles.group}>
            <label htmlFor="rf-date" className={styles.label}>
              Date Format
            </label>
            <Listbox
              id="rf-date"
              value={field.value}
              onChange={field.onChange}
              options={dateFormatOptions(todayIso())}
              skin={referenceSkin}
            />
            <p className={styles.hint}>The dates themselves are picked on each invoice.</p>
          </div>
        )}
      />

      {contentFieldGroups.map((group) => (
        <div key={group.id} className={styles.fieldGroup}>
          <p className={styles.groupTitle}>{group.title}</p>
          {group.hint ? <p className={styles.hint}>{group.hint}</p> : null}
          {group.fields.map((meta) => (
            <FieldRow key={meta.key} meta={meta} />
          ))}
        </div>
      ))}

      <Controller
        control={form.control}
        name="content.terms"
        render={({ field, fieldState }) => (
          <div className={styles.fieldGroup}>
            <label htmlFor="rf-terms" className={styles.label}>
              Default Terms &amp; Conditions
            </label>
            <textarea id="rf-terms" {...field} rows={3} maxLength={600} className={styles.textarea} />
            {fieldState.error ? <p className={styles.error}>{fieldState.error.message}</p> : null}
          </div>
        )}
      />
      <Controller
        control={form.control}
        name="content.statement"
        render={({ field }) => (
          <div className={styles.group}>
            <label htmlFor="rf-statement" className={styles.label}>
              Default Statement
            </label>
            <textarea id="rf-statement" {...field} rows={2} maxLength={600} className={styles.textarea} />
            <p className={styles.hint}>Copied into new invoices made with this template.</p>
          </div>
        )}
      />
    </>
  );
}

/* ------------------------------------------------------------------ dialogs */

function Method({
  icon: Icon,
  title,
  description,
  name,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  name: FieldPath<TemplateConfig>;
  children?: React.ReactNode;
}) {
  const { form } = useTemplateEditor();
  const enabled = useWatch({ control: form.control, name }) as boolean;

  return (
    <div className={styles.method}>
      <div className={styles.methodHead}>
        <Icon size={16} />
        <div className={styles.methodText}>
          <p className={styles.methodTitle}>{title}</p>
          <p className={styles.methodDesc}>{description}</p>
        </div>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <RefSwitch checked={Boolean(field.value)} onChange={field.onChange} label="" />
          )}
        />
      </div>
      {enabled && children ? <div className={styles.methodBody}>{children}</div> : null}
    </div>
  );
}

function PaymentsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { form } = useTemplateEditor();

  return (
    <RefDialog
      open={open}
      onClose={onClose}
      title="Payment methods"
      footer={
        <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={onClose}>
          Done
        </button>
      }
    >
      <Method
        icon={Landmark}
        title="Bank transfer"
        description="Print your account details on the paper."
        name="payments.bankTransfer.enabled"
      >
        <Controller
          control={form.control}
          name="payments.bankTransfer.details"
          render={({ field, fieldState }) => (
            <>
              <textarea {...field} rows={2} aria-label="Bank account details" className={styles.textarea} />
              {fieldState.error ? <p className={styles.error}>{fieldState.error.message}</p> : null}
            </>
          )}
        />
      </Method>
      <Method
        icon={CreditCard}
        title="Card"
        description="Adds a pay-online link. Card processing is simulated in this demo."
        name="payments.card.enabled"
      />
      <Method
        icon={Wallet}
        title="PayPal"
        description="Print the PayPal address customers pay to."
        name="payments.paypal.enabled"
      >
        <Controller
          control={form.control}
          name="payments.paypal.email"
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                type="email"
                placeholder="payments@company.com"
                aria-label="PayPal email"
                className={cn(styles.input, fieldState.error && styles.invalid)}
              />
              {fieldState.error ? <p className={styles.error}>{fieldState.error.message}</p> : null}
            </>
          )}
        />
      </Method>
    </RefDialog>
  );
}

/* ------------------------------------------------------------------ preview */

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

/* ------------------------------------------------------------------ layout */

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
  const cancel = React.useCallback(() => (dirty ? setDiscardOpen(true) : exit()), [dirty, exit]);

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
          <div className={styles.tabs} role="tablist" aria-orientation="vertical">
            {(["general", "content"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                id={`rf-tab-${value}`}
                aria-selected={tab === value}
                aria-controls="rf-panel"
                onClick={() => setTab(value)}
                className={cn(styles.tab, tab === value && styles.tabActive)}
              >
                {value === "general" ? "General" : "Content"}
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
              <button type="button" className={cn(styles.btn, styles.btnCancel)} onClick={cancel}>
                Cancel
              </button>
              <button type="button" className={cn(styles.btn, styles.btnPrimary)} onClick={onSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.preview} aria-label="Preview">
        <div className={styles.head}>
          <h2 className={styles.headTitle}>Preview</h2>
          <button type="button" className={styles.close} onClick={cancel} aria-label="Close">
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
            <button type="button" className={cn(styles.btn, styles.btnDanger)} onClick={exit}>
              Discard
            </button>
          </>
        }
      >
        <div className={styles.alert}>
          <AlertTriangle size={36} strokeWidth={1.5} />
          <p style={{ margin: 0 }}>
            You have unsaved changes to this template. If you close the customizer now, they will be
            lost.
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
