import { create } from "zustand";
import { persist } from "zustand/middleware";

import { browserStorage, STORAGE_KEYS } from "@/shared/lib/storage";
import { createId } from "@/shared/lib/id";
import {
  templateRecordSchema,
  toTemplateConfig,
  type TemplateConfig,
  type TemplateRecord,
} from "./schema";
import { defaultTemplateConfig, seedTemplates } from "./presets";

/** Which editor opens when a template is clicked: our own, or the 1:1 reference. */
export type EditorPreference = "studio" | "reference";

const DEFAULT_TEMPLATE_ID = "standard";

type TemplatesState = {
  templates: TemplateRecord[];
  defaultId: string;
  editorPreference: EditorPreference;
  create: (config?: TemplateConfig) => TemplateRecord;
  update: (id: string, config: TemplateConfig) => TemplateRecord | null;
  duplicate: (id: string) => TemplateRecord | null;
  /** False for the default template and for the last one left. */
  remove: (id: string) => boolean;
  setDefault: (id: string) => void;
  setEditorPreference: (value: EditorPreference) => void;
  reset: () => void;
};

type Persisted = Partial<
  Pick<TemplatesState, "templates" | "defaultId" | "editorPreference">
>;

const now = () => new Date().toISOString();

export const useTemplatesStore = create<TemplatesState>()(
  persist(
    (set, get) => ({
      templates: seedTemplates(),
      defaultId: DEFAULT_TEMPLATE_ID,
      editorPreference: "studio",

      create: (config = defaultTemplateConfig) => {
        const stamp = now();
        const record: TemplateRecord = {
          ...structuredClone(config),
          id: createId("tpl_"),
          createdAt: stamp,
          updatedAt: stamp,
        };
        set((state) => ({ templates: [...state.templates, record] }));
        return record;
      },

      update: (id, config) => {
        const existing = get().templates.find((template) => template.id === id);
        if (!existing) return null;

        const record: TemplateRecord = {
          ...structuredClone(config),
          id,
          createdAt: existing.createdAt,
          updatedAt: now(),
        };
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id ? record : template,
          ),
        }));
        return record;
      },

      duplicate: (id) => {
        const source = get().templates.find((template) => template.id === id);
        if (!source) return null;
        const config = toTemplateConfig(source);
        return get().create({ ...config, name: `${config.name} (copy)`.slice(0, 60) });
      },

      remove: (id) => {
        const { templates, defaultId } = get();
        if (templates.length <= 1 || id === defaultId) return false;
        set({ templates: templates.filter((template) => template.id !== id) });
        return true;
      },

      setDefault: (id) => set({ defaultId: id }),
      setEditorPreference: (editorPreference) => set({ editorPreference }),
      reset: () =>
        set({
          templates: seedTemplates(),
          defaultId: DEFAULT_TEMPLATE_ID,
          editorPreference: "studio",
        }),
    }),
    {
      name: STORAGE_KEYS.templates,
      version: 1,
      storage: browserStorage,
      partialize: (state) => ({
        templates: state.templates,
        defaultId: state.defaultId,
        editorPreference: state.editorPreference,
      }),
      // Stored data can be stale or hand-edited: keep valid templates, never end up with none.
      merge: (persisted, current) => {
        const saved = persisted as Persisted | undefined;
        const templates = (Array.isArray(saved?.templates) ? saved.templates : []).flatMap(
          (template) => {
            const parsed = templateRecordSchema.safeParse(template);
            return parsed.success ? [parsed.data] : [];
          },
        );
        if (!templates.length) return current;

        const defaultId = templates.find(
          (template) => template.id === saved?.defaultId,
        )?.id;
        return {
          ...current,
          templates,
          defaultId: defaultId ?? templates[0].id,
          editorPreference:
            saved?.editorPreference === "reference" ? "reference" : "studio",
        };
      },
    },
  ),
);

/** A template id from an invoice may point at a deleted template: fall back to the default. */
export function resolveTemplate(
  templates: TemplateRecord[],
  id: string | undefined,
  defaultId: string,
): TemplateRecord {
  return (
    templates.find((template) => template.id === id) ??
    templates.find((template) => template.id === defaultId) ??
    templates[0]
  );
}

export function editorHref(id: string, preference: EditorPreference): string {
  return preference === "reference" ? `/templates/${id}/reference` : `/templates/${id}`;
}
