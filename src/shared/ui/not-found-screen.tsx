import Link from "next/link";

export function NotFoundScreen({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center p-8">
      <div className="max-w-sm space-y-3 border-t-2 border-ink pt-4">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
        <Link
          href={href}
          className="inline-flex h-10 items-center border border-ink bg-ink px-4 text-sm font-medium text-panel"
        >
          {action}
        </Link>
      </div>
    </main>
  );
}
