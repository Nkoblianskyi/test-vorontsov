import { createId } from "@/shared/lib/id";

export const newLineItem = () => ({
  id: createId("li_"),
  name: "",
  description: "",
  quantity: 1,
  rate: 0,
});

/** Stable ids, so a click on the sheet can find the field that prints there. */
export const itemFieldId = (
  index: number,
  part: "name" | "description" | "quantity" | "rate",
) => `item-${index}-${part}`;
