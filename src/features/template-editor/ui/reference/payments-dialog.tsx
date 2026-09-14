"use client";

import * as React from "react";
import { CreditCard, Landmark, Wallet, type LucideIcon } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

import type { PaymentToggle } from "@/entities/template/model/schema";
import { cn } from "@/shared/lib/cn";
import { useTemplateEditor } from "../../model/use-template-editor";
import { RefDialog, RefSwitch } from "./primitives";
import styles from "./reference.module.css";

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
  name: PaymentToggle;
  children?: React.ReactNode;
}) {
  const { form } = useTemplateEditor();
  const enabled = useWatch({ control: form.control, name });

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
            <RefSwitch
              checked={field.value}
              onChange={field.onChange}
              label={`Accept ${title}`}
              hideLabel
            />
          )}
        />
      </div>
      {enabled && children ? <div className={styles.methodBody}>{children}</div> : null}
    </div>
  );
}

/** "Accept payment methods → Manage" from the reference. */
export function PaymentsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { form } = useTemplateEditor();

  return (
    <RefDialog
      open={open}
      onClose={onClose}
      title="Payment methods"
      footer={
        <button
          type="button"
          className={cn(styles.btn, styles.btnPrimary)}
          onClick={onClose}
        >
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
              <textarea
                {...field}
                rows={2}
                aria-label="Bank account details"
                className={styles.textarea}
              />
              {fieldState.error ? (
                <p className={styles.error}>{fieldState.error.message}</p>
              ) : null}
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
              {fieldState.error ? (
                <p className={styles.error}>{fieldState.error.message}</p>
              ) : null}
            </>
          )}
        />
      </Method>
    </RefDialog>
  );
}
