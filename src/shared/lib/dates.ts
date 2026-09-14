/** Calendar dates travel as "YYYY-MM-DD" strings: no time zone can shift an invoice date. */

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

function parts(iso: string): [number, number, number] {
  const [year, month, day] = iso.split("-").map(Number);
  return [year, month - 1, day];
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = parts(iso);
  return toIsoDate(new Date(year, month, day + days));
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.UTC(...parts(to)) - Date.UTC(...parts(from))) / 86_400_000);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
