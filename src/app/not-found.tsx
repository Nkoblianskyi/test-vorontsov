import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-8">
      <div className="max-w-sm space-y-3 border-t-2 border-ink pt-4">
        <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          The link is wrong or the page has moved. Your invoices are one click away.
        </p>
        <Link
          href="/invoices"
          className="inline-flex h-10 items-center border border-ink bg-ink px-4 text-sm font-medium text-panel"
        >
          Open invoices
        </Link>
      </div>
    </main>
  );
}
