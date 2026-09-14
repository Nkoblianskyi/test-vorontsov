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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Applies the stored interface theme before first paint.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('invoice-studio-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('theme-dark')}catch(e){}`,
          }}
        />
      </head>
      <body className={`${archivo.variable} ${newsreader.variable}`}>
        {children}
        <Toaster />
        <ConfirmHost />
      </body>
    </html>
  );
}
