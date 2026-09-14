import { useCompanyStore } from "@/entities/company/model/store";
import { useInvoicesStore } from "@/entities/invoice/model/store";
import { useTemplatesStore } from "@/entities/template/model/store";

/**
 * Operations that span several entities live here, not in the stores: a store
 * never reaches into another entity.
 */

/** Deletes a template and moves its invoices to the default one. False when it can't go. */
export function deleteTemplate(id: string): boolean {
  const { remove, defaultId } = useTemplatesStore.getState();
  if (!remove(id)) return false;
  useInvoicesStore.getState().reassignTemplate(id, defaultId);
  return true;
}

/** Puts every store back to the sample data; persistence writes the seeds through. */
export function resetDemoData() {
  useCompanyStore.getState().reset();
  useInvoicesStore.getState().reset();
  useTemplatesStore.getState().reset();
}
