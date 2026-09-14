import type { Metadata } from "next";
import { TemplatesView } from "@/views/templates/ui/templates-view";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return <TemplatesView />;
}
