"use client";

import * as React from "react";
import { useHydrated } from "@/shared/lib/use-hydrated";

/** Renders children only after hydration, when localStorage-backed stores are readable. */
export function ClientGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hydrated = useHydrated();
  return <>{hydrated ? children : (fallback ?? <ScreenSkeleton />)}</>;
}

export function PageSkeleton() {
  return (
    <div
      className="mx-auto max-w-[1240px] space-y-6 px-4 py-6 sm:px-8 sm:py-8"
      aria-busy="true"
    >
      <div className="h-16 border-b border-rule-strong" />
      <div className="grid h-28 grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
        {[0, 1, 2, 3].map((cell) => (
          <div key={cell} className="bg-panel" />
        ))}
      </div>
      <div className="h-80 border border-rule bg-panel" />
    </div>
  );
}

function ScreenSkeleton() {
  return (
    <div
      className="flex h-dvh items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-micro text-ink-faint">
        <span className="skeleton-bar h-px w-16 bg-ink" aria-hidden />
        Loading workspace
      </div>
    </div>
  );
}
