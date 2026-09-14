import type { EditorTab } from "../model/use-template-editor";

/** A control in the template editor: which tab it lives on, and its element id. */
export type StudioTarget = { tab: EditorTab; id: string };

const targets: Record<string, StudioTarget> = {
  title: { tab: "content", id: "document-title" },
  logo: { tab: "general", id: "section-logo" },
  payment: { tab: "general", id: "section-payments" },
  terms: { tab: "content", id: "default-terms" },
  statement: { tab: "content", id: "default-statement" },
  "meta.number": { tab: "content", id: "field-row-invoiceNumber" },
  "meta.issueDate": { tab: "content", id: "field-row-issueDate" },
  "meta.dueDate": { tab: "content", id: "field-row-dueDate" },
  "meta.reference": { tab: "content", id: "field-row-reference" },
  seller: { tab: "content", id: "field-row-companyAddress" },
  labels: { tab: "content", id: "field-row-itemName" },
  subtotal: { tab: "content", id: "field-row-subtotal" },
  discount: { tab: "content", id: "field-row-discount" },
  total: { tab: "content", id: "field-row-total" },
  paid: { tab: "content", id: "field-row-paymentMade" },
  balance: { tab: "content", id: "field-row-balanceDue" },
  footer: { tab: "content", id: "field-row-pageFooter" },
};

const itemRows: Record<string, string> = {
  name: "field-row-itemName",
  description: "field-row-itemDescription",
  quantity: "field-row-itemQuantity",
  rate: "field-row-itemRate",
};

/** In a template, a click on the sheet leads to the setting that shapes that spot. */
export function studioTarget(key: string): StudioTarget | null {
  if (targets[key]) return targets[key];
  if (key.startsWith("buyer")) return { tab: "content", id: "field-row-billedTo" };
  if (key.startsWith("tax.")) return { tab: "content", id: "field-row-taxes" };
  const item = /^item\.\d+\.(\w+)$/.exec(key);
  if (item) return { tab: "content", id: itemRows[item[1]] ?? "field-row-itemName" };
  return null;
}
