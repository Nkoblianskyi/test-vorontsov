"use client";

import * as React from "react";
import { useTemplateEditor } from "@/features/template-editor/model/use-template-editor";

const DELAY_MS = 700;

export type TemplateSaveState = "saved" | "saving" | "invalid";

/** Saves design changes shortly after they stop; there is no Save button in the composer. */
export function useTemplateAutosave(): TemplateSaveState {
  const { dirty, config, save } = useTemplateEditor();
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      void save({ silent: true }).then((ok) => setFailed(!ok));
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, config, save]);

  if (!dirty) return "saved";
  return failed ? "invalid" : "saving";
}
