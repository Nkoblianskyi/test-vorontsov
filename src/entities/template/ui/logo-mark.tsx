import { readableInk } from "@/shared/lib/color";
import type { TemplateConfig } from "../model/schema";

/**
 * The company mark on the sheet: the uploaded file when there is one, otherwise
 * a monogram block in the primary colour. `box` is a CSS length (mm or px).
 */
export function LogoMark({
  logo,
  color,
  box,
}: {
  logo: TemplateConfig["logo"];
  color: string;
  box: string;
}) {
  if (!logo.show) return null;

  const radius = logo.shape === "circle" ? "50%" : 0;

  if (logo.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.src}
        alt=""
        style={{
          width: box,
          height: box,
          objectFit: "contain",
          borderRadius: radius,
          flexShrink: 0,
        }}
      />
    );
  }

  const shaped = logo.shape !== "bare";

  return (
    <div
      aria-hidden
      style={{
        width: box,
        height: box,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: shaped ? color : "transparent",
        color: shaped ? readableInk(color) : color,
        borderRadius: radius,
        fontSize: `calc(${box} * 0.46)`,
        fontWeight: 600,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {logo.monogram || "–"}
    </div>
  );
}
