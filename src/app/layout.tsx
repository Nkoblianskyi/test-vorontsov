import type { Metadata } from "next";
import { archivo, newsreader } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice Studio — template settings",
  description:
    "Set up how invoices look: colours, logo, layout and wording, with a live A4 preview.",
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
      <body className={`${archivo.variable} ${newsreader.variable}`}>{children}</body>
    </html>
  );
}
