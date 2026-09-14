import { NotFoundScreen } from "@/shared/ui/not-found-screen";

export function TemplateNotFound() {
  return (
    <NotFoundScreen
      title="Template not found"
      description="It was deleted, or the link points to a template that never existed."
      href="/templates"
      action="Back to templates"
    />
  );
}
