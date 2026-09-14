import type { Metadata } from "next";
import { Composer } from "@/views/composer/ui/composer";

export const metadata: Metadata = { title: "Composer" };

export default async function ComposerPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: fresh } = await searchParams;
  return <Composer key={fresh ?? "new"} />;
}
