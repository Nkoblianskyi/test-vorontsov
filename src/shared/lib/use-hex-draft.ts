import * as React from "react";
import { normalizeHex } from "./color";

/**
 * A hex text field that only commits valid colours: typing "#2c3" stays a draft
 * until Enter or blur; invalid input snaps back to the current value.
 */
export function useHexDraft(value: string, onChange: (hex: string) => void) {
  const [draft, setDraft] = React.useState(value);
  const [lastValue, setLastValue] = React.useState(value);

  // Undo, presets and swatches change the value from outside: adjust during render
  // rather than in an effect, so the input never paints a stale hex.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const commit = () => {
    const hex = normalizeHex(draft);
    if (hex) onChange(hex);
    else setDraft(value);
  };

  return {
    value: draft,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
    onBlur: commit,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      }
    },
  };
}
