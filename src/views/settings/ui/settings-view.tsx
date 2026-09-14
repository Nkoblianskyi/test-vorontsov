"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  companyProfileSchema,
  invoicingDefaultsSchema,
} from "@/entities/company/model/schema";
import {
  defaultCompany,
  defaultInvoicing,
  useCompanyStore,
} from "@/entities/company/model/store";
import { nextInvoiceNumber, useInvoicesStore } from "@/entities/invoice/model/store";
import { resetDemoData } from "@/features/workspace-data/model/actions";
import { currencyNames, currencyValues } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { requestConfirm } from "@/shared/ui/confirm";
import { Field } from "@/shared/ui/field";
import { Input, Textarea } from "@/shared/ui/input";
import { Listbox } from "@/shared/ui/listbox";
import { PageHeader } from "@/shared/ui/page-header";
import { Segmented } from "@/shared/ui/segmented";
import { toast } from "@/shared/ui/toast";

const settingsSchema = z.object({
  profile: companyProfileSchema,
  invoicing: invoicingDefaultsSchema,
});

type SettingsValues = z.infer<typeof settingsSchema>;

const TERM_OPTIONS = [0, 7, 14, 30, 45].map((days) => ({
  value: String(days),
  label: days === 0 ? "On receipt" : `${days} days`,
}));

function Block({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 border-t border-rule-strong pt-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-micro leading-relaxed text-ink-soft">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const router = useRouter();
  const profile = useCompanyStore((state) => state.profile);
  const invoicing = useCompanyStore((state) => state.invoicing);
  const invoices = useInvoicesStore((state) => state.invoices);

  const form = useForm<SettingsValues>({
    defaultValues: { profile, invoicing },
    resolver: zodResolver(settingsSchema),
    mode: "onTouched",
  });
  const { errors, isDirty } = form.formState;
  const prefix = useWatch({ control: form.control, name: "invoicing.prefix" });

  const submit = form.handleSubmit((values) => {
    useCompanyStore.getState().updateProfile(values.profile);
    useCompanyStore.getState().updateInvoicing(values.invoicing);
    form.reset(values);
    toast("Settings saved", {
      tone: "positive",
      description: "Every template preview and new invoice uses them now.",
    });
  });

  const resetDemo = async () => {
    const confirmed = await requestConfirm({
      title: "Reset demo data?",
      description:
        "Invoices, templates and company details go back to the sample set. Anything you created is removed.",
      confirmLabel: "Reset everything",
      tone: "danger",
    });
    if (!confirmed) return;
    resetDemoData();
    form.reset({ profile: defaultCompany, invoicing: defaultInvoicing });
    toast("Demo data restored", { description: "Sample invoices and templates are back." });
    router.push("/invoices");
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-8 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Who your invoices come from, and how new ones start."
        actions={
          <>
            {isDirty ? (
              <Button variant="ghost" onClick={() => form.reset()}>
                Discard
              </Button>
            ) : null}
            <Button
              variant={isDirty ? "signal" : "solid"}
              onClick={() => void submit()}
              disabled={!isDirty}
            >
              Save changes
            </Button>
          </>
        }
      />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-10"
      >
        <Block
          title="Company"
          description="Printed in the seller block of every invoice, in every template."
        >
          <Field
            label="Company name"
            htmlFor="company-name"
            required
            error={errors.profile?.name?.message}
          >
            <Input
              id="company-name"
              autoComplete="organization"
              {...form.register("profile.name")}
            />
          </Field>
          <Field
            label="Address"
            htmlFor="company-address"
            hint="One line per row, as it should print."
            error={errors.profile?.address?.message}
          >
            <Textarea id="company-address" rows={3} {...form.register("profile.address")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              htmlFor="company-phone"
              error={errors.profile?.phone?.message}
            >
              <Input
                id="company-phone"
                type="tel"
                autoComplete="tel"
                {...form.register("profile.phone")}
              />
            </Field>
            <Field
              label="Billing email"
              htmlFor="company-email"
              error={errors.profile?.email?.message}
            >
              <Input
                id="company-email"
                type="email"
                autoComplete="email"
                {...form.register("profile.email")}
              />
            </Field>
          </div>
          <Field
            label="Tax ID"
            htmlFor="company-tax"
            error={errors.profile?.taxId?.message}
          >
            <Input id="company-tax" {...form.register("profile.taxId")} />
          </Field>
        </Block>

        <Block
          title="New invoices"
          description="Defaults for the invoice form. Invoices you already made keep their own values."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Number prefix"
              htmlFor="invoice-prefix"
              error={errors.invoicing?.prefix?.message}
              hint={
                prefix && !errors.invoicing?.prefix ? (
                  <>
                    Next number:{" "}
                    <span className="tnum text-ink">
                      {nextInvoiceNumber(invoices, prefix)}
                    </span>
                  </>
                ) : undefined
              }
            >
              <Input
                id="invoice-prefix"
                className="tnum"
                {...form.register("invoicing.prefix")}
              />
            </Field>
            <Controller
              control={form.control}
              name="invoicing.currency"
              render={({ field }) => (
                <Field label="Currency" htmlFor="invoice-currency">
                  <Listbox
                    id="invoice-currency"
                    value={field.value}
                    onChange={field.onChange}
                    options={currencyValues.map((currency) => ({
                      value: currency,
                      label: `${currency} · ${currencyNames[currency]}`,
                    }))}
                  />
                </Field>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="invoicing.paymentTermsDays"
            render={({ field }) => (
              <Field label="Payment terms" hint="Sets the due date of a new invoice.">
                <Segmented
                  name="Payment terms"
                  value={String(field.value)}
                  onChange={(value) => field.onChange(Number(value))}
                  options={TERM_OPTIONS}
                />
              </Field>
            )}
          />
        </Block>

        <Block
          title="Demo data"
          description="This demo keeps everything in your browser's local storage. Nothing is sent anywhere."
        >
          <div className="flex flex-col items-start gap-2 border border-dashed border-rule-strong p-4">
            <p className="text-sm">Start over with the sample invoices and templates.</p>
            <Button type="button" size="sm" onClick={resetDemo}>
              Reset demo data
            </Button>
          </div>
        </Block>
      </form>
    </div>
  );
}
