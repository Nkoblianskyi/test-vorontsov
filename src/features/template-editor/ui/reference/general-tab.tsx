"use client";

import { CreditCard } from "lucide-react";
import { Controller } from "react-hook-form";

import { LogoMark } from "@/entities/template/ui/logo-mark";
import { cn } from "@/shared/lib/cn";
import { useLogoUpload } from "../../model/use-logo-upload";
import { useTemplateEditor } from "../../model/use-template-editor";
import { ColorRow, RefSwitch } from "./primitives";
import styles from "./reference.module.css";

function LogoBox() {
  const { config } = useTemplateEditor();
  const upload = useLogoUpload();

  return (
    <div className={styles.logoWrap}>
      <button
        type="button"
        className={cn(styles.logoBox, upload.dragging && styles.logoBoxDragging)}
        onClick={upload.openPicker}
        {...upload.dropProps}
        title="Click or drop an image to replace the logo"
        aria-label="Upload company logo"
      >
        <LogoMark
          logo={{
            ...config.logo,
            show: true,
            shape: config.logo.shape === "circle" ? "circle" : "square",
          }}
          color={config.primaryColor}
          box="86px"
        />
      </button>
      {config.logo.src ? (
        <div className={styles.logoActions}>
          <button type="button" className={styles.logoAction} onClick={upload.remove}>
            Remove
          </button>
        </div>
      ) : null}
      <input {...upload.inputProps} />
      {upload.problem ? <p className={styles.error}>{upload.problem}</p> : null}
    </div>
  );
}

export function GeneralTab({ onManagePayments }: { onManagePayments: () => void }) {
  const { form, config } = useTemplateEditor();
  const { bankTransfer, card, paypal } = config.payments;
  const enabledMethods = [bankTransfer.enabled, card.enabled, paypal.enabled].filter(
    Boolean,
  ).length;
  const paymentError = Boolean(form.formState.errors.payments);

  return (
    <>
      <h3 className={styles.sectionTitle}>General Branding</h3>
      <p className={styles.sectionDesc}>
        Set your company logo and branding colors to be automatically applied to your
        invoices.
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
            {fieldState.error ? (
              <p className={styles.error}>{fieldState.error.message}</p>
            ) : null}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="primaryColor"
        render={({ field }) => (
          <ColorRow label="Primary Color" value={field.value} onChange={field.onChange} />
        )}
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
        {paymentError ? (
          <span className={styles.paymentError}>Needs details</span>
        ) : enabledMethods ? (
          <span className={styles.paymentMeta}>{enabledMethods} on</span>
        ) : null}
        <button type="button" className={styles.link} onClick={onManagePayments}>
          Manage
        </button>
      </div>
    </>
  );
}
