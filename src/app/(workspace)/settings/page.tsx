import type { Metadata } from "next";
import { SettingsView } from "@/views/settings/ui/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsView />;
}
