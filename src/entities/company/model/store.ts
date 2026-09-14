import { create } from "zustand";
import { persist } from "zustand/middleware";

import { browserStorage, STORAGE_KEYS } from "@/shared/lib/storage";
import {
  companyProfileSchema,
  invoicingDefaultsSchema,
  type CompanyProfile,
  type InvoicingDefaults,
} from "./schema";

export type { CompanyProfile, InvoicingDefaults } from "./schema";

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
  reset: () => void;
};

type Persisted = Partial<Pick<CompanyState, "profile" | "invoicing">> | undefined;

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      profile: defaultCompany,
      invoicing: defaultInvoicing,
      updateProfile: (profile) => set({ profile }),
      updateInvoicing: (invoicing) => set({ invoicing }),
      reset: () => set({ profile: defaultCompany, invoicing: defaultInvoicing }),
    }),
    {
      name: STORAGE_KEYS.company,
      version: 1,
      storage: browserStorage,
      partialize: (state) => ({ profile: state.profile, invoicing: state.invoicing }),
      // Each block falls back to its default on its own if the stored copy no longer validates.
      merge: (persisted, current) => {
        const saved = persisted as Persisted;
        const profile = companyProfileSchema.safeParse(saved?.profile);
        const invoicing = invoicingDefaultsSchema.safeParse(saved?.invoicing);
        return {
          ...current,
          profile: profile.success ? profile.data : current.profile,
          invoicing: invoicing.success ? invoicing.data : current.invoicing,
        };
      },
    },
  ),
);
