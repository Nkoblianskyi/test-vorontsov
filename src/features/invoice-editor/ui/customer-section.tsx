"use client";

import { Field, SectionHeading } from "@/shared/ui/field";
import { Input, Textarea } from "@/shared/ui/input";
import type { InvoiceEditorApi } from "../model/use-invoice-editor";

export function CustomerSection({ editor }: { editor: InvoiceEditorApi }) {
  const { form, values, customers, fillCustomer } = editor;
  const errors = form.formState.errors.customer;

  return (
    <section className="space-y-4">
      <SectionHeading index="01" title="Customer" />

      {!values.customer?.name && customers.length ? (
        <div className="space-y-1.5">
          <p className="field-label">Recent customers</p>
          <div className="flex flex-wrap gap-1.5">
            {customers.map((customer) => (
              <button
                key={customer.name}
                type="button"
                onClick={() => fillCustomer(customer)}
                className="border border-rule px-2 py-1 text-[0.8125rem] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {customer.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Field
        label="Customer name"
        htmlFor="customer-name"
        required
        error={errors?.name?.message}
      >
        <Input
          id="customer-name"
          autoComplete="organization"
          aria-invalid={Boolean(errors?.name)}
          {...form.register("customer.name")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="customer-email" error={errors?.email?.message}>
          <Input
            id="customer-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors?.email)}
            {...form.register("customer.email")}
          />
        </Field>
        <Field label="Tax ID" htmlFor="customer-tax" error={errors?.taxId?.message}>
          <Input id="customer-tax" {...form.register("customer.taxId")} />
        </Field>
      </div>
      <Field
        label="Billing address"
        htmlFor="customer-address"
        hint="One line per row, as it should print."
        error={errors?.address?.message}
      >
        <Textarea
          id="customer-address"
          rows={3}
          className="[field-sizing:content]"
          {...form.register("customer.address")}
        />
      </Field>
    </section>
  );
}
