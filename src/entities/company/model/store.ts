import { create } from "zustand";
import { persist } from "zustand/middleware";

import { browserStorage, STORAGE_KEYS } from "@/shared/lib/storage";
import type { Currency } from "@/shared/lib/format";

/** The seller: printed on every invoice, edited once in Settings. */
export type CompanyProfile = {
  name: string;
  address: string;
  email: string;
  phone: string;
  taxId: string;
};

export type InvoicingDefaults = {
  prefix: string;
  paymentTermsDays: number;
  currency: Currency;
};

export const defaultCompany: CompanyProfile = {
  name: "Northfield Studio, Inc.",
  address: "48 Harbor Street, Suite 210\nWilmington, Delaware 19801\nUnited States",
  email: "",
  phone: "+1 302-555-0148",
  taxId: "",
};

export const defaultInvoicing: InvoicingDefaults = {
  prefix: "INV-",
  paymentTermsDays: 14,
  currency: "USD",
};

type CompanyState = {
  profile: CompanyProfile;
  invoicing: InvoicingDefaults;
  updateProfile: (profile: CompanyProfile) => void;
  updateInvoicing: (invoicing: InvoicingDefaults) => void;
};

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      profile: defaultCompany,
      invoicing: defaultInvoicing,
      updateProfile: (profile) => set({ profile }),
      updateInvoicing: (invoicing) => set({ invoicing }),
    }),
    {
      name: STORAGE_KEYS.company,
      version: 1,
      storage: browserStorage,
      partialize: (state) => ({ profile: state.profile, invoicing: state.invoicing }),
    },
  ),
);
