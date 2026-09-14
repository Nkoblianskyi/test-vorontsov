"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/ui/button";

const STORAGE_KEY = "invoice-studio-theme";
const DARK_CLASS = "theme-dark";

/** The <html> class is the source of truth: the inline script in layout sets it
 *  before first paint, so there is no flash and no state to synchronise. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const dark = React.useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains(DARK_CLASS),
    () => false,
  );

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle(DARK_CLASS, next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private mode or blocked storage: the theme still applies for this session.
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light interface" : "Switch to dark interface"}
      title="The sheet stays light either way"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
