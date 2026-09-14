"use client";

import * as React from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { templateConfigSchema, type TemplateConfig } from "./schema";
import { templatePresets, type TemplatePreset } from "./presets";
import { saveTemplateAction } from "../actions/save-template";

const HISTORY_DEBOUNCE_MS = 400;
const HISTORY_LIMIT = 60;

type History = { stack: TemplateConfig[]; index: number };

type EditorContextValue = {
  form: UseFormReturn<TemplateConfig>;
  config: TemplateConfig;
  dirty: boolean;
  saving: boolean;
  savedAt: string;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  revert: () => void;
  applyPreset: (preset: TemplatePreset) => void;
  activePresetId: string | null;
  save: () => void;
};

const EditorContext = React.createContext<EditorContextValue | null>(null);

export function useTemplateEditor(): EditorContextValue {
  const context = React.useContext(EditorContext);
  if (!context) {
    throw new Error("useTemplateEditor must be used inside TemplateEditorProvider");
  }
  return context;
}

export function TemplateEditorProvider({
  templateId,
  initialConfig,
  initialUpdatedAt,
  children,
}: {
  templateId: string;
  initialConfig: TemplateConfig;
  initialUpdatedAt: string;
  children: React.ReactNode;
}) {
  const form = useForm<TemplateConfig>({
    defaultValues: initialConfig,
    resolver: zodResolver(templateConfigSchema),
    mode: "onChange",
  });

  const config = useWatch({ control: form.control }) as TemplateConfig;

  const [saving, startSaving] = React.useTransition();
  const [savedConfig, setSavedConfig] = React.useState(initialConfig);
  const [savedAt, setSavedAt] = React.useState(initialUpdatedAt);

  // --- history -------------------------------------------------------------
  const [history, setHistory] = React.useState<History>({
    stack: [initialConfig],
    index: 0,
  });

  /** Set while undo/redo writes into the form, so the edit is not recorded twice. */
  const replaying = React.useRef(false);

  React.useEffect(() => {
    if (replaying.current) {
      replaying.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setHistory((current) => {
        if (JSON.stringify(current.stack[current.index]) === JSON.stringify(config)) {
          return current;
        }

        const stack = [...current.stack.slice(0, current.index + 1), config].slice(
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

  // --- actions -------------------------------------------------------------
  const save = React.useCallback(() => {
    startSaving(async () => {
      const valid = await form.trigger();
      if (!valid) return;

      const values = form.getValues();
      const result = await saveTemplateAction(templateId, values);

      if (result.status === "saved") {
        setSavedConfig(values);
        setSavedAt(result.updatedAt);
        return;
      }

      for (const [path, message] of Object.entries(result.errors)) {
        form.setError(path as keyof TemplateConfig, { message });
      }
    });
  }, [form, templateId]);

  /** Reverting and applying a preset are edits: they land in history like any other. */
  const revert = React.useCallback(() => {
    form.reset(savedConfig, { keepDefaultValues: true });
  }, [form, savedConfig]);

  const applyPreset = React.useCallback(
    (preset: TemplatePreset) => {
      form.reset(preset.apply(form.getValues()), { keepDefaultValues: true });
    },
    [form],
  );

  // --- keyboard ------------------------------------------------------------
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;

      const key = event.key.toLowerCase();

      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }

      if (key === "s") {
        event.preventDefault();
        save();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, save]);

  const activePresetId = React.useMemo(() => {
    const match = templatePresets.find(
      (preset) => JSON.stringify(preset.apply(config)) === JSON.stringify(config),
    );
    return match?.id ?? null;
  }, [config]);

  const value: EditorContextValue = {
    form,
    config,
    dirty: JSON.stringify(savedConfig) !== JSON.stringify(config),
    saving,
    savedAt,
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
