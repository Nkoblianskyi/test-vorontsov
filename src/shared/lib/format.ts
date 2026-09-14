export const currencyValues = ["USD", "EUR", "GBP", "PLN", "UAH"] as const;
export type Currency = (typeof currencyValues)[number];

export const currencyNames: Record<Currency, string> = {
  USD: "US dollar",
  EUR: "Euro",
  GBP: "Pound sterling",
  PLN: "Polish złoty",
  UAH: "Ukrainian hryvnia",
};

const currencyLocale: Record<Currency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  PLN: "pl-PL",
  UAH: "uk-UA",
};

export const dateFormatValues = ["long", "european", "numeric", "iso"] as const;
export type DateFormat = (typeof dateFormatValues)[number];

export const dateFormatNames: Record<DateFormat, string> = {
  long: "Month D, YYYY",
  european: "D Month YYYY",
  numeric: "DD/MM/YYYY",
  iso: "ISO 8601",
};

/** Options for a date-format picker, each shown as today's date in that format. */
export function dateFormatOptions(today: string) {
  return dateFormatValues.map((format) => ({
    value: format,
    label: formatDate(today, format),
    description: dateFormatNames[format],
  }));
}

/** NaN and -0 both print badly ("NaN", "-$0.00"); money on paper is always a real number. */
const finite = (value: number) => (Number.isFinite(value) ? value : 0) || 0;

export function formatMoney(
  value: number,
  currency: Currency,
  options: { symbol?: boolean } = {},
): string {
  const locale = currencyLocale[currency] ?? "en-US";
  return new Intl.NumberFormat(locale, {
    ...(options.symbol === false ? {} : { style: "currency", currency }),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(finite(value));
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(finite(value));
}

export function formatPercent(rate: number): string {
  return `${finite(rate).toFixed(2)}%`;
}

const dateOptions: Record<
  Exclude<DateFormat, "iso">,
  { locale: string; options: Intl.DateTimeFormatOptions }
> = {
  long: { locale: "en-US", options: { month: "long", day: "numeric", year: "numeric" } },
  european: { locale: "en-GB", options: { day: "numeric", month: "long", year: "numeric" } },
  numeric: { locale: "en-GB", options: { day: "2-digit", month: "2-digit", year: "numeric" } },
};

export function formatDate(iso: string, format: DateFormat): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? "")) return "—";
  if (format === "iso") return iso;

  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";

  const { locale, options } = dateOptions[format];
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
