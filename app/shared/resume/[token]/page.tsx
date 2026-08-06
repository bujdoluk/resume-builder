
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import SharedDocumentView from "@/components/share/SharedDocumentView";
import { getResumeByShareToken } from "@/lib/supabase/resumes";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

interface PageProps {
  params: Promise<{ token: string }>;
}

// De-duplicates the lookup between generateMetadata and the page render
// below — React's cache() memoizes per-request, not across requests.
const loadResume = cache((token: string) => getResumeByShareToken(createServiceRoleClient(), token));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const resume = await loadResume(token);
  // Deliberately not localized: this Server Component can't import the
  // i18n singleton directly (initReactI18next touches client-only React
  // APIs at import time, which breaks the RSC build) and this is only ever
  // seen as a browser-tab title for an invalid/expired link, not the
  // page's actual visible UI — that part (below) is fully localized via
  // SharedDocumentView, a Client Component.
  return { title: resume ? resume.name : "Link not found" };
}

export default async function SharedResumePage({ params }: PageProps) {
  const { token } = await params;
  const resume = await loadResume(token);
  if (!resume) notFound();

  return (
    <SharedDocumentView
      title={resume.name}
      pdfUrl={`/shared/resume/${token}/pdf`}
      downloadFileName={`${resume.name}.pdf`}
    />
  );
}
