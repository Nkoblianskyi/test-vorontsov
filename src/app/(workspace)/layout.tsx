import { AppShell } from "@/widgets/app-shell/ui/app-shell";
import { ClientGate, PageSkeleton } from "@/shared/ui/client-gate";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ClientGate fallback={<PageSkeleton />}>{children}</ClientGate>
    </AppShell>
  );
}
