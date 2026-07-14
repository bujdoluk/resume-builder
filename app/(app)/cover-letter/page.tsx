/**
 * Route entry for `/cover-letter`, the cover letter builder. Reads the `id`
 * query param on the server and hands it to the client-side
 * `CoverLetterBuilder` component, which owns all editor state.
 */
import type { Metadata } from "next";
import CoverLetterBuilder from "@/components/cover-letter/CoverLetterBuilder";

export const metadata: Metadata = {
  alternates: {
    canonical: "/cover-letter",
  },
};

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { id } = await searchParams;

  return <CoverLetterBuilder initialCoverLetterId={id} />;
}
