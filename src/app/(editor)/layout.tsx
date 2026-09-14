import { ClientGate } from "@/shared/ui/client-gate";

/** Full-screen editors: no sidebar, every pixel goes to the form and the sheet. */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <ClientGate>{children}</ClientGate>;
}
