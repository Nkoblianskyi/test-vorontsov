"use client";

import * as React from "react";
import { useForm, useWatch, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  templateConfigSchema,
  toTemplateConfig,
  type TemplateConfig,
  type TemplateRecord,
} from "@/entities/template/model/schema";
import {
  applyPreset as applyPresetTo,
  matchesPreset,
  templatePresets,
  type TemplatePreset,
} from "@/entities/template/model/presets";
import { useTemplatesStore } from "@/entities/template/model/store";
import { deepEqual } from "@/shared/lib/equal";
import { toast } from "@/shared/ui/toast";

const HISTORY_DEBOUNCE_MS = 400;
const HISTORY_LIMIT = 60;

export type EditorTab = "general" | "content";

type History = { stack: TemplateConfig[]; index: number };

type EditorContextValue = {
  templateId: string;
  form: UseFormReturn<TemplateConfig>;
  /** Live values: every keystroke, for the preview. */
  config: TemplateConfig;
  dirty: boolean;
  savedAt: string;
  tab: EditorTab;
  setTab: (tab: EditorTab) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  revert: () => void;
  applyPreset: (preset: TemplatePreset) => void;
  activePresetId: string | null;
  save: () => Promise<boolean>;
};

const EditorContext = React.createContext<EditorContextValue | null>(null);

export function useTemplateEditor(): EditorContextValue {
  const context = React.useContext(EditorContext);
  if (!context) throw new Error("useTemplateEditor must be used inside TemplateEditorProvider");
  return context;
}

/** First readable message in a nested RHF error tree. `ref` holds DOM nodes: never walk it. */
function firstError(errors: FieldErrors | undefined): string | undefined {
  if (!errors) return undefined;
  for (const [key, value] of Object.entries(errors)) {
    if (!value || key === "ref") continue;
    if (typeof (value as { message?: unknown }).message === "string") {
      return (value as { message: string }).message;
    }
    const nested = firstError(value as FieldErrors);
    if (nested) return nested;
  }
  return undefined;
}

function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement || target.isContentEditable) return true;
  return (
    target instanceof HTMLInputElement &&
    !["checkbox", "radio", "range", "color", "button", "submit", "file"].includes(target.type)
  );
}

/**
 * Shared by both editors (reference layout and Studio): one form, one history,
 * one save path. The two UIs differ only in how they draw these controls.
 */
export function TemplateEditorProvider({
  template,
  children,
}: {
  template: TemplateRecord;
  children: React.ReactNode;
}) {
  const templateId = template.id;
  const [initialConfig] = React.useState(() => toTemplateConfig(template));

  const form = useForm<TemplateConfig>({
    defaultValues: initialConfig,
    resolver: zodResolver(templateConfigSchema),
    mode: "onChange",
  });

  const config = useWatch({ control: form.control }) as TemplateConfig;

  const [savedConfig, setSavedConfig] = React.useState(initialConfig);
  const [savedAt, setSavedAt] = React.useState(template.updatedAt);
  const [tab, setTab] = React.useState<EditorTab>("general");

  // --- history ---------------------------------------------------------------
  const [history, setHistory] = React.useState<History>({ stack: [initialConfig], index: 0 });

  /** Set while undo/redo writes into the form, so the replay is not recorded again. */
  const replaying = React.useRef(false);

  React.useEffect(() => {
    if (replaying.current) {
      replaying.current = false;
      return;
    }

    // Debounced: dragging a slider produces one undo step, not forty.
    const timer = setTimeout(() => {
      setHistory((current) => {
        if (deepEqual(current.stack[current.index], config)) return current;
        const stack = [...current.stack.slice(0, current.index + 1), structuredClone(config)].slice(
          -HISTORY_LIMIT,
        );
        return { stack, index: stack.length - 1 };
      });
    }, HISTORY_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [config]);

  const replay = React.useCallback(
    (index: number) => {
      replaying.current = true;
      form.reset(history.stack[index], { keepDefaultValues: true });
      setHistory({ ...history, index });
    },
    [form, history],
  );

  const undo = React.useCallback(() => {
    if (history.index > 0) replay(history.index - 1);
  }, [history.index, replay]);

  const redo = React.useCallback(() => {
    if (history.index < history.stack.length - 1) replay(history.index + 1);
  }, [history.index, history.stack.length, replay]);

  // --- actions ---------------------------------------------------------------
  const save = React.useCallback(async () => {
    const valid = await form.trigger();

    if (!valid) {
      const errors = form.formState.errors;
      setTab(errors.content ? "content" : "general");
      toast("Some fields need attention", { tone: "danger", description: firstError(errors) });
      return false;
    }

    const values = structuredClone(form.getValues());
    const record = useTemplatesStore.getState().update(templateId, values);

    if (!record) {
      toast("This template no longer exists", {
        tone: "danger",
        description: "It was deleted in another tab. Go back to the template list.",
      });
      return false;
    }

    setSavedConfig(values);
    setSavedAt(record.updatedAt);
    return true;
  }, [form, templateId]);

  /** Reverting and applying a preset are edits: they land in history like any other. */
  const revert = React.useCallback(() => {
    form.reset(savedConfig, { keepDefaultValues: true });
  }, [form, savedConfig]);

  const applyPreset = React.useCallback(
    (preset: TemplatePreset) => {
      form.reset(applyPresetTo(form.getValues(), preset), { keepDefaultValues: true });
    },
    [form],
  );

  const dirty = !deepEqual(savedConfig, config);

  // --- keyboard and leave guard ------------------------------------------------
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        void save().then((ok) => ok && toast("Template saved", { tone: "positive" }));
        return;
      }

      // Inside a text field the browser's own undo is the one people expect.
      if ((key === "z" || key === "y") && !isTextTarget(event.target)) {
        event.preventDefault();
        if (key === "y" || event.shiftKey) redo();
        else undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, save]);

  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const activePresetId = React.useMemo(
    () => templatePresets.find((preset) => matchesPreset(config, preset))?.id ?? null,
    [config],
  );

  const value: EditorContextValue = {
    templateId,
    form,
    config,
    dirty,
    savedAt,
    tab,
    setTab,
    canUndo: history.index > 0,
    canRedo: history.index < history.stack.length - 1,
    undo,
    redo,
    revert,
    applyPreset,
    activePresetId,
    save,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
