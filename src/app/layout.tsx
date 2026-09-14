import type { Metadata } from "next";
import { archivo, newsreader } from "./fonts";
import { Toaster } from "@/shared/ui/toast";
import { ConfirmHost } from "@/shared/ui/confirm";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Invoice Studio", template: "%s · Invoice Studio" },
  description:
    "Issue invoices and design how they look: templates with colours, logo and wording, and a live A4 preview.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The font variables go on <html>: the theme's --font-sans / --font-serif live on
    // :root and reference them, so they must already be defined at that level.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${newsreader.variable}`}
    >
      <head>
        <script
          // Applies the stored interface theme before first paint.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('invoice-studio-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('theme-dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster />
        <ConfirmHost />
      </body>
    </html>
  );
}
