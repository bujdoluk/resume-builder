import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import SharedDocumentView from "@/components/share/SharedDocumentView";
import { getResumeByShareToken } from "@/lib/supabase/resumes";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

interface PageProps {
  params: Promise<{ token: string }>;
}

// cache() dedupes the lookup between generateMetadata and the render, per request.
const loadResume = cache((token: string) => getResumeByShareToken(createServiceRoleClient(), token));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const resume = await loadResume(token);
  // Not localized: importing i18n here breaks the RSC build, and this title only shows for dead links.
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
