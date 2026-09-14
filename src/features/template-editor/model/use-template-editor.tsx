"use client";

import * as React from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
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
import { firstErrorMessage } from "@/shared/lib/form-errors";
import { useUnsavedChangesGuard } from "@/shared/lib/use-unsaved-changes";
import { toast } from "@/shared/ui/toast";

const HISTORY_DEBOUNCE_MS = 400;
const HISTORY_LIMIT = 60;

export type EditorTab = "general" | "content";

type History = { stack: TemplateConfig[]; index: number };

type SaveOptions = {
  /** For autosave: no toasts, no tab switching; the caller shows its own status. */
  silent?: boolean;
};

function record(history: History, config: TemplateConfig): History {
  const stack = [
    ...history.stack.slice(0, history.index + 1),
    structuredClone(config),
  ].slice(-HISTORY_LIMIT);
  return { stack, index: stack.length - 1 };
}

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
  save: (options?: SaveOptions) => Promise<boolean>;
};

const EditorContext = React.createContext<EditorContextValue | null>(null);

export function useTemplateEditor(): EditorContextValue {
  const context = React.useContext(EditorContext);
  if (!context)
    throw new Error("useTemplateEditor must be used inside TemplateEditorProvider");
  return context;
}

function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement || target.isContentEditable) return true;
  return (
    target instanceof HTMLInputElement &&
    !["checkbox", "radio", "range", "color", "button", "submit", "file"].includes(
      target.type,
    )
  );
}

/**
 * Shared by every template UI (reference layout, Studio, the composer's design
 * panel): one form, one history, one save path. The UIs differ only in how they
 * draw these controls.
 */
export function TemplateEditorProvider({
  template,
  keyboard = true,
  children,
}: {
  template: TemplateRecord;
  /** Ctrl+S / Ctrl+Z shortcuts. Off where another form owns the keyboard. */
  keyboard?: boolean;
  children: React.ReactNode;
}) {
  const templateId = template.id;
  const [initialConfig] = React.useState(() => toTemplateConfig(template));

  const form = useForm<TemplateConfig>({
    defaultValues: initialConfig,
    resolver: zodResolver(templateConfigSchema),
    mode: "onChange",
  });

  // useWatch is typed deep-partial; the defaults are complete and fields never
  // unregister, so every key is present.
  const config = useWatch({ control: form.control }) as TemplateConfig;

  const [savedConfig, setSavedConfig] = React.useState(initialConfig);
  const [savedAt, setSavedAt] = React.useState(template.updatedAt);
  const [tab, setTab] = React.useState<EditorTab>("general");

  // --- history ---------------------------------------------------------------
  const [history, setHistory] = React.useState<History>({
    stack: [initialConfig],
    index: 0,
  });

  /** Set while undo/redo writes into the form, so the replay is not recorded again. */
  const replaying = React.useRef(false);

  /** An edit still inside the debounce window: already real to the user, not yet in the stack. */
  const pending = !deepEqual(history.stack[history.index], config);

  React.useEffect(() => {
    if (replaying.current) {
      replaying.current = false;
      return;
    }

    // Debounced: dragging a slider produces one undo step, not forty.
    const timer = setTimeout(() => {
      setHistory((current) =>
        deepEqual(current.stack[current.index], config) ? current : record(current, config),
      );
    }, HISTORY_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [config]);

  const goTo = React.useCallback(
    (next: History) => {
      replaying.current = true;
      form.reset(next.stack[next.index], { keepDefaultValues: true });
      setHistory(next);
    },
    [form],
  );

  const undo = React.useCallback(() => {
    // Record a pending edit first, so undo steps back one edit — not two.
    const settled = pending ? record(history, form.getValues()) : history;
    if (settled.index > 0) goTo({ ...settled, index: settled.index - 1 });
  }, [pending, history, form, goTo]);

  const redo = React.useCallback(() => {
    if (!pending && history.index < history.stack.length - 1) {
      goTo({ ...history, index: history.index + 1 });
    }
  }, [pending, history, goTo]);

  // --- actions ---------------------------------------------------------------
  const save = React.useCallback(
    async ({ silent = false }: SaveOptions = {}) => {
      const valid = await form.trigger();

      if (!valid) {
        if (!silent) {
          const errors = form.formState.errors;
          setTab(errors.content ? "content" : "general");
          toast("Some fields need attention", {
            tone: "danger",
            description: firstErrorMessage(errors),
          });
        }
        return false;
      }

      const values = structuredClone(form.getValues());
      const saved = useTemplatesStore.getState().update(templateId, values);

      if (!saved) {
        toast("This template no longer exists", {
          tone: "danger",
          description: "It was deleted in another tab. Go back to the template list.",
        });
        return false;
      }

      setSavedConfig(values);
      setSavedAt(saved.updatedAt);
      return true;
    },
    [form, templateId],
  );

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
    if (!keyboard) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        if (dirty)
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
  }, [keyboard, dirty, undo, redo, save]);

  useUnsavedChangesGuard(dirty);

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
    canUndo: pending || history.index > 0,
    canRedo: !pending && history.index < history.stack.length - 1,
    undo,
    redo,
    revert,
    applyPreset,
    activePresetId,
    save,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
