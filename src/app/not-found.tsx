import { NotFoundScreen } from "@/shared/ui/not-found-screen";

export default function NotFound() {
  return (
    <NotFoundScreen
      title="Page not found"
      description="The link is wrong or the page has moved. Your invoices are one click away."
      href="/invoices"
      action="Open invoices"
    />
  );
}
