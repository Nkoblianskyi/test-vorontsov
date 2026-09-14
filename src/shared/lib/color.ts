export type Rgb = { r: number; g: number; b: number };

export function normalizeHex(input: string): string | null {
  const value = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .split("")
      .map((c) => c + c)
      .join("")
      .toLowerCase()}`;
  }
  if (/^[0-9a-f]{6}$/i.test(value)) return `#${value.toLowerCase()}`;
  return null;
}

export function hexToRgb(hex: string): Rgb {
  const safe = normalizeHex(hex) ?? "#000000";
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16),
  };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG 2.1 contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** Text colour that stays readable on the given background. */
export function readableInk(background: string): string {
  return contrastRatio(background, "#ffffff") >= 4.5 ? "#ffffff" : "#111111";
}

export function mix(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const t = Math.min(Math.max(amount, 0), 1);
  const channel = (x: number, y: number) => Math.round(x + (y - x) * t);
  return (
    "#" +
    [channel(a.r, b.r), channel(a.g, b.g), channel(a.b, b.b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

export const tint = (hex: string, amount: number) => mix(hex, "#ffffff", amount);
export const shade = (hex: string, amount: number) => mix(hex, "#000000", amount);

export type ContrastVerdict = {
  ratio: number;
  level: "aa-large" | "aa" | "aaa" | "fail";
  message: string;
};

export function auditContrast(
  foreground: string,
  background: string,
  label: string,
): ContrastVerdict {
  const ratio = Math.round(contrastRatio(foreground, background) * 100) / 100;
  if (ratio >= 7) {
    return { ratio, level: "aaa", message: `${label} is easy to read.` };
  }
  if (ratio >= 4.5) {
    return { ratio, level: "aa", message: `${label} passes for body text.` };
  }
  if (ratio >= 3) {
    return {
      ratio,
      level: "aa-large",
      message: `${label} only works at large sizes. Darken the colour for small text.`,
    };
  }
  return {
    ratio,
    level: "fail",
    message: `${label} is hard to read. Pick a darker or lighter colour.`,
  };
}
