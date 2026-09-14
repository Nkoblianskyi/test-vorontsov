import localFont from "next/font/local";

/**
 * Self-hosted variable fonts: no request to a third party, no layout shift,
 * and invoices render the same on a locked-down accounting workstation.
 */
export const archivo = localFont({
  src: "../assets/fonts/archivo-variable.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
});

export const newsreader = localFont({
  src: "../assets/fonts/newsreader-variable.woff2",
  variable: "--font-newsreader",
  weight: "200 800",
  display: "swap",
});
