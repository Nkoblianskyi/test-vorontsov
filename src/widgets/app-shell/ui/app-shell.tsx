"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutTemplate,
  Plus,
  Settings2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { useCompanyStore } from "@/entities/company/model/store";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

const navigation: NavItem[] = [
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/vision", label: "Vision", icon: Sparkles, badge: "new" },
];

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center bg-ink text-[0.625rem] font-bold tracking-tight text-panel">
        IS
      </span>
      <span className="text-sm font-semibold tracking-tight">Invoice Studio</span>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const company = useCompanyStore((state) => state.profile);
  const hydrated = useHydrated();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-20 flex flex-col border-b border-rule-strong bg-panel lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-16">
          <Link href="/invoices" aria-label="Invoice Studio, invoices">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <Button asChild size="sm" variant="solid">
              <Link href="/invoices/new">
                <Plus className="h-3.5 w-3.5" />
                New invoice
              </Link>
            </Button>
          </div>
        </div>

        <div className="hidden px-4 pb-5 lg:block">
          <Button asChild variant="solid" className="w-full">
            <Link href="/invoices/new">
              <Plus className="h-4 w-4" />
              New invoice
            </Link>
          </Button>
        </div>

        {/* Phones: four equal tabs, icon over label, never wider than the screen. */}
        <nav
          aria-label="Main"
          className="grid grid-cols-4 border-t border-rule lg:flex lg:flex-col lg:border-t-0"
        >
          {navigation.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[0.6875rem] transition-colors",
                  "lg:flex-row lg:gap-3 lg:px-4 lg:py-2.5 lg:text-sm",
                  active
                    ? "font-medium text-ink"
                    : "text-ink-soft hover:bg-panel-sunken hover:text-ink",
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-x-3 bottom-0 h-0.5 bg-ink lg:inset-x-auto lg:inset-y-1.5 lg:left-0 lg:h-auto lg:w-0.5"
                    aria-hidden
                  />
                ) : null}
                <Icon className={cn("h-4 w-4", item.badge && "text-signal")} aria-hidden />
                <span className="truncate">{item.label}</span>
                {item.badge ? (
                  <span className="absolute top-1.5 right-[calc(50%-1.1rem)] h-1.5 w-1.5 bg-signal lg:static lg:ml-auto lg:h-auto lg:w-auto lg:border lg:border-signal lg:bg-transparent lg:px-1 lg:text-[0.625rem] lg:font-semibold lg:tracking-wider lg:text-signal lg:uppercase">
                    <span className="sr-only lg:not-sr-only">{item.badge}</span>
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-rule p-4 lg:block">
          <p className="field-label">Signed in as</p>
          <p className="truncate text-sm font-medium">{hydrated ? company.name : " "}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-micro leading-snug text-ink-faint">
              Demo workspace. Data stays in this browser.
            </span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
