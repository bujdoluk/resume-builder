
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import SharedDocumentView from "@/components/SharedDocumentView";
import { getCoverLetterByShareToken } from "@/lib/supabase/coverLetters";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

interface PageProps {
  params: Promise<{ token: string }>;
}

// De-duplicates the lookup between generateMetadata and the page render
// below — React's cache() memoizes per-request, not across requests.
const loadCoverLetter = cache((token: string) =>
  getCoverLetterByShareToken(createServiceRoleClient(), token),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const coverLetter = await loadCoverLetter(token);
  // Deliberately not localized — see the matching comment in
  // app/shared/resume/[token]/page.tsx.
  return { title: coverLetter ? coverLetter.name : "Link not found" };
}

export default async function SharedCoverLetterPage({ params }: PageProps) {
  const { token } = await params;
  const coverLetter = await loadCoverLetter(token);
  if (!coverLetter) notFound();

  return (
    <SharedDocumentView
      title={coverLetter.name}
      pdfUrl={`/shared/cover-letter/${token}/pdf`}
      downloadFileName={`${coverLetter.name}.pdf`}
    />
  );
}
