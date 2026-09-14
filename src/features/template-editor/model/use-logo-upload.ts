"use client";

import * as React from "react";
import { readLogoFile } from "../lib/read-logo";
import { useTemplateEditor } from "./use-template-editor";

const ACCEPT = "image/png,image/jpeg,image/svg+xml,image/webp";

/** Drag-and-drop plus file picker for the template logo; both editors draw their own box. */
export function useLogoUpload() {
  const { form } = useTemplateEditor();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);

  const read = async (file: File | undefined) => {
    if (!file) return;
    const result = await readLogoFile(file);
    if (!result.ok) {
      setProblem(result.message);
      return;
    }
    setProblem(null);
    form.setValue("logo.src", result.src, { shouldDirty: true });
    form.setValue("logo.show", true, { shouldDirty: true });
  };

  return {
    dragging,
    problem,
    openPicker: () => inputRef.current?.click(),
    remove: () => form.setValue("logo.src", null, { shouldDirty: true }),
    dropProps: {
      onDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        setDragging(true);
      },
      onDragLeave: () => setDragging(false),
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        setDragging(false);
        void read(event.dataTransfer.files?.[0]);
      },
    },
    inputProps: {
      ref: inputRef,
      type: "file" as const,
      hidden: true,
      accept: ACCEPT,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        void read(event.target.files?.[0]);
        event.target.value = "";
      },
    },
  };
}
