"use client";

import { templatePresets } from "@/entities/template/model/presets";
import { cn } from "@/shared/lib/cn";
import { SectionHeading } from "@/shared/ui/field";
import { useTemplateEditor } from "../../model/use-template-editor";

export function PresetSection() {
  const { applyPreset, activePresetId } = useTemplateEditor();

  return (
    <section className="space-y-3">
      <SectionHeading
        index="01"
        title="Preset"
        description="A starting point for the look. Your wording and logo stay as they are."
      />
      <div className="grid grid-cols-2 gap-px border border-rule bg-rule">
        {templatePresets.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              aria-pressed={active}
              className={cn(
                "flex flex-col gap-2 p-3 text-left transition-colors",
                active ? "bg-ink text-panel" : "bg-panel hover:bg-panel-sunken",
              )}
            >
              <span className="flex h-6 w-full" aria-hidden>
                <span
                  className="flex-[3]"
                  style={{ background: preset.look.primaryColor }}
                />
                <span
                  className="flex-1"
                  style={{ background: preset.look.secondaryColor }}
                />
                <span
                  className="flex-1 border border-rule"
                  style={{ background: preset.look.paperTint }}
                />
              </span>
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[0.8125rem] font-medium">{preset.name}</span>
                <span
                  className={cn("text-micro", active ? "text-panel/60" : "text-ink-faint")}
                >
                  {preset.look.design === "classic" ? "Classic" : "Swiss"}
                </span>
              </span>
              <span
                className={cn(
                  "text-micro leading-snug",
                  active ? "text-panel/70" : "text-ink-faint",
                )}
              >
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
