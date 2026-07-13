/**
 * Route entry for `/app`, the resume editor. Reads the `template` and
 * `resumeId` query params on the server and hands them to the client-side
 * `Home` component, which owns all editor state.
 */
import type { Metadata } from "next";
import Home from "@/components/Home";

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

  return <Home initialTemplateId={template} initialResumeId={resumeId} />;
}
