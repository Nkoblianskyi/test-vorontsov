"use client";

import * as React from "react";
import { AlertTriangle, CreditCard } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { SectionHeading } from "@/shared/ui/field";
import { useTemplateEditor } from "../../model/use-template-editor";
import { PaymentMethodsDialog, paymentSummary } from "./payment-methods-dialog";

export function PaymentsSection() {
  const { form, config } = useTemplateEditor();
  const [open, setOpen] = React.useState(false);
  const hasError = Boolean(form.formState.errors.payments);

  return (
    <section id="section-payments" className="space-y-3">
      <SectionHeading index="05" title="Payments" />
      <div
        className={cn(
          "flex items-center justify-between gap-3 border bg-panel-sunken p-3",
          hasError ? "border-signal" : "border-rule",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {hasError ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-signal" aria-hidden />
          ) : (
            <CreditCard className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-sm">Accept payment methods</p>
            <p
              className={cn(
                "truncate text-micro",
                hasError ? "text-signal" : "text-ink-faint",
              )}
            >
              {hasError ? "A method needs details" : paymentSummary(config.payments)}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Manage
        </Button>
      </div>
      <PaymentMethodsDialog open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
