import Link from "next/link";

export function TemplateNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-8">
      <div className="max-w-sm space-y-3 border-t-2 border-ink pt-4">
        <h1 className="text-xl font-semibold tracking-tight">Template not found</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          It was deleted, or the link points to a template that never existed.
        </p>
        <Link
          href="/templates"
          className="inline-flex h-10 items-center border border-ink bg-ink px-4 text-sm font-medium text-panel"
        >
          Back to templates
        </Link>
      </div>
    </main>
  );
}
