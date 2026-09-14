import { createJSONStorage } from "zustand/middleware";

export const STORAGE_ERROR_EVENT = "invoice-studio:storage-error";

export const STORAGE_KEYS = {
  templates: "invoice-studio:templates",
  invoices: "invoice-studio:invoices",
  company: "invoice-studio:company",
} as const;

/**
 * localStorage that never throws: private mode, blocked storage and a full quota
 * (large logos are data URLs) degrade to "not persisted" plus a toast, not a crash.
 */
export const browserStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(STORAGE_ERROR_EVENT));
      }
    }
  },
  removeItem: (name: string) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Nothing to clean up when storage is unavailable.
    }
  },
}));
