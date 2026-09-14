import type { ContentFieldKey } from "./schema";

export type ContentFieldMeta = {
  key: ContentFieldKey;
  /** What the field is, in the editor. The label is what the customer reads. */
  title: string;
  /** Always printed: an invoice without a number or a total is not an invoice. */
  locked?: boolean;
  /** Some rows print their own text (tax names, footer) and have no label. */
  labelEditable?: boolean;
  placeholder?: string;
};

export type ContentFieldGroup = {
  id: string;
  title: string;
  hint?: string;
  fields: ContentFieldMeta[];
};

export const contentFieldGroups: ContentFieldGroup[] = [
  {
    id: "header",
    title: "Header",
    fields: [
      { key: "invoiceNumber", title: "Invoice number", locked: true, labelEditable: true },
      { key: "issueDate", title: "Issue date", labelEditable: true },
      { key: "dueDate", title: "Due date", labelEditable: true },
      { key: "reference", title: "Reference / PO", labelEditable: true },
    ],
  },
  {
    id: "parties",
    title: "Addresses",
    fields: [
      {
        key: "companyAddress",
        title: "Company address",
        labelEditable: true,
        placeholder: "No caption",
      },
      { key: "billedTo", title: "Billed to", labelEditable: true },
    ],
  },
  {
    id: "items",
    title: "Line items",
    fields: [
      { key: "itemName", title: "Item", locked: true, labelEditable: true },
      { key: "itemDescription", title: "Description", labelEditable: true },
      { key: "itemQuantity", title: "Quantity", labelEditable: true },
      { key: "itemRate", title: "Rate", labelEditable: true },
      { key: "itemTotal", title: "Line total", locked: true, labelEditable: true },
    ],
  },
  {
    id: "totals",
    title: "Totals",
    hint: "Hiding a line never changes the amounts: the total still includes it.",
    fields: [
      { key: "subtotal", title: "Subtotal", labelEditable: true },
      { key: "discount", title: "Discount", labelEditable: true },
      { key: "taxes", title: "Tax lines", labelEditable: false },
      { key: "total", title: "Total", locked: true, labelEditable: true },
      { key: "paymentMade", title: "Payment made", labelEditable: true },
      { key: "balanceDue", title: "Balance due", labelEditable: true },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    fields: [
      { key: "paymentDetails", title: "Payment details", labelEditable: true },
      { key: "terms", title: "Terms & conditions", labelEditable: true },
      { key: "statement", title: "Statement", labelEditable: true },
      { key: "pageFooter", title: "Page footer", labelEditable: false },
    ],
  },
];
