"use client";

import * as React from "react";
import { createPortal } from "react-dom";

/** One editable spot on the sheet, wired to whichever form owns it. */
export type InlineField = {
  /** The `data-edit` key; also identifies the spot for Tab navigation. */
  key: string;
  label: string;
  input: "text" | "textarea" | "number";
  read: () => string;
  write: (value: string) => void;
};

type Box = { left: number; top: number; width: number; height: number; sheetWidth: number };

export type InlineSession = {
  field: InlineField;
  anchor: HTMLElement;
  sheet: HTMLElement;
  box: Box;
  font: React.CSSProperties;
  paper: string;
};

const FONT_PROPERTIES = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "color",
  "textAlign",
  "textTransform",
] as const;

/**
 * Measures a spot on the scaled sheet in the sheet's own, unscaled units. The
 * editor is then placed *inside* the sheet, so it scales with it and sits exactly
 * over the text, in the same font.
 */
export function measureOnSheet(anchor: HTMLElement): Omit<InlineSession, "field"> | null {
  const sheet = anchor.closest<HTMLElement>('[data-print="sheet"]');
  if (!sheet) return null;

  const sheetRect = sheet.getBoundingClientRect();
  const scale = sheetRect.width / sheet.offsetWidth || 1;
  const rect = anchor.getBoundingClientRect();
  const style = getComputedStyle(anchor);
  const article = anchor.closest("article");

  return {
    anchor,
    sheet,
    box: {
      left: (rect.left - sheetRect.left) / scale,
      top: (rect.top - sheetRect.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
      sheetWidth: sheet.offsetWidth,
    },
    font: Object.fromEntries(
      FONT_PROPERTIES.map((property) => [property, style[property]]),
    ) as React.CSSProperties,
    paper: article ? getComputedStyle(article).backgroundColor : "#ffffff",
  };
}

export function InlineSheetEditor({
  session,
  onClose,
  onMove,
}: {
  session: InlineSession | null;
  onClose: () => void;
  onMove: (direction: 1 | -1) => void;
}) {
  if (!session) return null;
  return createPortal(
    <InlineInput
      key={`${session.field.key}:${session.box.top}:${session.box.left}`}
      session={session}
      onClose={onClose}
      onMove={onMove}
    />,
    session.sheet,
  );
}

function InlineInput({
  session,
  onClose,
  onMove,
}: {
  session: InlineSession;
  onClose: () => void;
  onMove: (direction: 1 | -1) => void;
}) {
  const { field, box, font, paper, anchor } = session;
  const [original] = React.useState(field.read);
  const [draft, setDraft] = React.useState(original);
  /** Tab hands over to the next spot: that blur must not close the session. */
  const handingOver = React.useRef(false);

  React.useEffect(() => {
    anchor.setAttribute("data-editing", "");
    return () => anchor.removeAttribute("data-editing");
  }, [anchor]);

  const change = (value: string) => {
    setDraft(value);
    field.write(value);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      field.write(original);
      onClose();
    } else if (
      event.key === "Enter" &&
      (field.input !== "textarea" || event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault();
      onClose();
    } else if (event.key === "Tab") {
      event.preventDefault();
      handingOver.current = true;
      onMove(event.shiftKey ? -1 : 1);
    }
  };

  // Right-aligned figures grow to the left, like the text they replace.
  const alignRight = font.textAlign === "right" || font.textAlign === "end";
  const style: React.CSSProperties = {
    ...font,
    position: "absolute",
    top: box.top - 3,
    ...(alignRight
      ? { right: box.sheetWidth - (box.left + box.width) - 3 }
      : { left: box.left - 3 }),
    minWidth: Math.max(box.width + 6, 56),
    maxWidth: box.sheetWidth - 16,
    minHeight: box.height + 6,
    padding: "2px 3px",
    margin: 0,
    border: 0,
    background: paper,
    outline: "2px solid var(--color-signal)",
    boxShadow: "0 10px 30px -12px rgba(0, 0, 0, 0.45)",
    resize: "none",
    zIndex: 5,
  };

  const shared = {
    "aria-label": field.label,
    autoFocus: true,
    value: draft,
    onKeyDown,
    onBlur: () => {
      if (!handingOver.current) onClose();
    },
    "data-print": "hide",
    className: "[field-sizing:content]",
    style,
  };

  return field.input === "textarea" ? (
    <textarea {...shared} onChange={(event) => change(event.target.value)} />
  ) : (
    <input
      {...shared}
      type="text"
      inputMode={field.input === "number" ? "decimal" : undefined}
      spellCheck={field.input !== "number"}
      onFocus={(event) => event.target.select()}
      onChange={(event) => change(event.target.value)}
    />
  );
}
