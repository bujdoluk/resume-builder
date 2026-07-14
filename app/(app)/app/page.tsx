/**
 * Route entry for `/app`, the resume editor. Reads the `template` and
 * `resumeId` query params on the server and hands them to the client-side
 * `ResumeBuilder` component, which owns all editor state.
 */
import type { Metadata } from "next";
import ResumeBuilder from "@/components/resumes/ResumeBuilder";

export const metadata: Metadata = {
  alternates: {
    canonical: "/app",
  },
};

interface PageProps {
  searchParams: Promise<{ template?: string; resumeId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { template, resumeId } = await searchParams;

  return (
    <ResumeBuilder initialTemplateId={template} initialResumeId={resumeId} />
  );
}
