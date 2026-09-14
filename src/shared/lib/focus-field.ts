/**
 * Brings a form control into view, focuses it and flashes an outline, so a click on
 * the preview visibly lands somewhere. Sections without a native focus get tabindex -1.
 */
export function focusField(id: string, { click = false }: { click?: boolean } = {}): boolean {
  const element = document.getElementById(id);
  if (!element) return false;

  if (!element.matches("input, textarea, select, button, a[href], [tabindex]")) {
    element.setAttribute("tabindex", "-1");
  }

  element.scrollIntoView({ block: "center", behavior: "smooth" });
  element.focus({ preventScroll: true });

  element.classList.remove("edit-flash");
  void element.offsetWidth; // restart the animation
  element.classList.add("edit-flash");
  window.setTimeout(() => element.classList.remove("edit-flash"), 1500);

  if (click) element.click();
  return true;
}
