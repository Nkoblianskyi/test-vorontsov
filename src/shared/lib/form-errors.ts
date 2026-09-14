import type { FieldErrors } from "react-hook-form";

/** Visits every message in a nested react-hook-form error tree. `ref` holds DOM nodes: never walk it. */
function walk(errors: FieldErrors | undefined, visit: (message: string) => boolean | void) {
  if (!errors) return false;
  for (const [key, value] of Object.entries(errors)) {
    if (!value || key === "ref") continue;
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string") {
      if (visit(message)) return true;
    } else if (walk(value as FieldErrors, visit)) {
      return true;
    }
  }
  return false;
}

export function firstErrorMessage(errors: FieldErrors | undefined): string | undefined {
  let first: string | undefined;
  walk(errors, (message) => {
    first = message;
    return true;
  });
  return first;
}

export function countErrors(errors: FieldErrors | undefined): number {
  let count = 0;
  walk(errors, () => {
    count += 1;
  });
  return count;
}
