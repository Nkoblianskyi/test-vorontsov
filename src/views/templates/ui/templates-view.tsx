"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Plus, Star, Trash2 } from "lucide-react";

import { useCompanyStore } from "@/entities/company/model/store";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import { referenceSample } from "@/entities/invoice/model/samples";
import { InvoiceDocument } from "@/entities/invoice/ui/invoice-document";
import { SheetThumbnail } from "@/entities/invoice/ui/sheet";
import { defaultTemplateConfig } from "@/entities/template/model/presets";
import type { TemplateRecord } from "@/entities/template/model/schema";
import { editorHref, useTemplatesStore } from "@/entities/template/model/store";
import { deleteTemplate } from "@/features/workspace-data/model/actions";
import { formatTimestamp } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { requestConfirm } from "@/shared/ui/confirm";
import { PageHeader } from "@/shared/ui/page-header";
import { Segmented } from "@/shared/ui/segmented";
import { toast } from "@/shared/ui/toast";

export function TemplatesView() {
  const router = useRouter();
  const templates = useTemplatesStore((state) => state.templates);
  const defaultId = useTemplatesStore((state) => state.defaultId);
  const preference = useTemplatesStore((state) => state.editorPreference);
  const invoices = useInvoicesStore((state) => state.invoices);
  const company = useCompanyStore((state) => state.profile);

  const sample = React.useMemo(() => referenceSample(company), [company]);
  const usage = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const invoice of invoices) {
      counts.set(invoice.templateId, (counts.get(invoice.templateId) ?? 0) + 1);
    }
    return counts;
  }, [invoices]);

  const open = (template: TemplateRecord) =>
    router.push(editorHref(template.id, preference));

  const create = () => {
    const record = useTemplatesStore
      .getState()
      .create({ ...structuredClone(defaultTemplateConfig), name: "Untitled template" });
    router.push(editorHref(record.id, preference));
  };

  const duplicate = (template: TemplateRecord) => {
    const copy = useTemplatesStore.getState().duplicate(template.id);
    if (copy)
      toast(`Created “${copy.name}”`, { description: "Open it to make it your own." });
  };

  const setDefault = (template: TemplateRecord) => {
    useTemplatesStore.getState().setDefault(template.id);
    toast(`“${template.name}” is now the default`, {
      description: "New invoices start with it.",
    });
  };

  const remove = async (template: TemplateRecord) => {
    const count = usage.get(template.id) ?? 0;
    const confirmed = await requestConfirm({
      title: `Delete “${template.name}”?`,
      description: count
        ? `${count} ${count === 1 ? "invoice uses" : "invoices use"} it. They will switch to the default template.`
        : "No invoices use it. This can't be undone.",
      confirmLabel: "Delete template",
      tone: "danger",
    });
    if (!confirmed || !deleteTemplate(template.id)) return;
    toast(`“${template.name}” deleted`);
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        eyebrow="Workspace"
        title="Invoice templates"
        description="How your invoices look. New invoices use the default template; any invoice can switch to another one."
        actions={
          <Button variant="solid" onClick={create}>
            <Plus className="h-4 w-4" />
            New template
          </Button>
        }
      />

      <div className="flex flex-col gap-4 border border-rule bg-panel p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-sm font-medium">Open templates in</p>
          <p className="text-micro leading-relaxed text-ink-soft">
            Both editors change the same template.{" "}
            <strong className="font-medium text-ink">Reference 1:1</strong> reproduces the
            original customize screen exactly.{" "}
            <strong className="font-medium text-ink">Studio</strong> is our redesign of the
            same flow, with presets, undo and a print-ready A4 preview.
          </p>
        </div>
        <Segmented
          name="Default editor"
          value={preference}
          onChange={(value) => useTemplatesStore.getState().setEditorPreference(value)}
          className="md:w-72"
          options={[
            { value: "studio", label: "Studio" },
            { value: "reference", label: "Reference 1:1" },
          ]}
        />
      </div>

      <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isDefault = template.id === defaultId;
          const count = usage.get(template.id) ?? 0;
          const other = preference === "studio" ? "reference" : "studio";

          return (
            <li key={template.id} className="flex flex-col bg-panel">
              <button
                type="button"
                onClick={() => open(template)}
                aria-label={`Customize ${template.name}`}
                className="group stage-grid block bg-canvas px-8 pt-8 pb-0"
              >
                <div className="h-64 overflow-hidden sm:h-72">
                  <SheetThumbnail className="sheet-shadow transition-transform duration-200 group-hover:-translate-y-1">
                    <InvoiceDocument
                      config={template}
                      data={{
                        ...sample,
                        terms: template.content.terms,
                        statement: template.content.statement,
                      }}
                    />
                  </SheetThumbnail>
                </div>
              </button>

              <div className="flex flex-1 flex-col gap-4 border-t border-rule p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium">
                      <span
                        className="h-3 w-3 shrink-0"
                        style={{ background: template.primaryColor }}
                        aria-hidden
                      />
                      {template.name}
                    </p>
                    <p className="mt-0.5 text-micro text-ink-faint">
                      {template.design === "classic" ? "Classic layout" : "Swiss grid"} ·{" "}
                      {count
                        ? `${count} ${count === 1 ? "invoice" : "invoices"}`
                        : "not used yet"}{" "}
                      · edited {formatTimestamp(template.updatedAt)}
                    </p>
                  </div>
                  {isDefault ? <Badge tone="solid">Default</Badge> : null}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="solid" onClick={() => open(template)}>
                    Customize
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={editorHref(template.id, other)}>
                      {other === "reference" ? "Reference 1:1" : "Studio"}
                    </Link>
                  </Button>
                  <div className="ml-auto flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDefault(template)}
                      disabled={isDefault}
                      aria-label={`Make ${template.name} the default`}
                      title={isDefault ? "Already the default" : "Make default"}
                    >
                      <Star
                        className="h-4 w-4"
                        fill={isDefault ? "currentColor" : "none"}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicate(template)}
                      aria-label={`Duplicate ${template.name}`}
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(template)}
                      disabled={isDefault || templates.length <= 1}
                      aria-label={`Delete ${template.name}`}
                      title={isDefault ? "Choose another default first" : "Delete"}
                      className="hover:text-signal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
