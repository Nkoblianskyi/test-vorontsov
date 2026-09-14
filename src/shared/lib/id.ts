/** `crypto.randomUUID` only exists in secure contexts; a LAN demo over http falls back. */
export function createId(prefix = ""): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}${random}`;
}
