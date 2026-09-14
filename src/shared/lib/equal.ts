/**
 * Structural equality for plain form data. Cheaper than comparing JSON strings:
 * a 500 KB logo data URL is compared by reference first and never re-serialised.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;

  return keys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key]),
  );
}
