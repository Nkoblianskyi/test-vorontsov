"use client";

import * as React from "react";
import { CreditCard, Landmark, Wallet, type LucideIcon } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

import type { PaymentToggle, TemplateConfig } from "@/entities/template/model/schema";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Input, Textarea } from "@/shared/ui/input";
import { useTemplateEditor } from "../../model/use-template-editor";

function MethodRow({
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
    <div className="space-y-3 p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-micro leading-relaxed text-ink-faint">{description}</p>
        </div>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label={`Accept ${title}`}
            />
          )}
        />
      </div>
      {enabled ? <div className="pl-7">{children}</div> : null}
    </div>
  );
}

export function paymentSummary(payments: TemplateConfig["payments"]): string {
  const names = [
    payments.bankTransfer.enabled && "Bank transfer",
    payments.card.enabled && "Card",
    payments.paypal.enabled && "PayPal",
  ].filter(Boolean);
  return names.length ? names.join(" · ") : "None enabled";
}

export function PaymentMethodsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { form } = useTemplateEditor();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Payment methods"
      description="Enabled methods are printed in the payment details block of every invoice that uses this template."
      footer={
        <Button size="sm" variant="solid" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="divide-y divide-rule border border-rule">
        <MethodRow
          icon={Landmark}
          title="Bank transfer"
          description="Prints your account details."
          name="payments.bankTransfer.enabled"
        >
          <Controller
            control={form.control}
            name="payments.bankTransfer.details"
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <Textarea
                  {...field}
                  rows={2}
                  aria-label="Bank account details"
                  maxLength={300}
                />
                {fieldState.error ? (
                  <p role="alert" className="text-micro text-signal">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />
        </MethodRow>

        <MethodRow
          icon={CreditCard}
          title="Card"
          description="Adds a pay-online link. Card processing is simulated in this demo."
          name="payments.card.enabled"
        />

        <MethodRow
          icon={Wallet}
          title="PayPal"
          description="Prints the address customers send money to."
          name="payments.paypal.enabled"
        >
          <Controller
            control={form.control}
            name="payments.paypal.email"
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <Input
                  {...field}
                  type="email"
                  placeholder="payments@company.com"
                  aria-label="PayPal email"
                />
                {fieldState.error ? (
                  <p role="alert" className="text-micro text-signal">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />
        </MethodRow>
      </div>
    </Dialog>
  );
}
