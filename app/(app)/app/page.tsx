/**
 * Route entry for `/app`, the resume editor. Reads the `template` and
 * `resumeId` query params on the server and hands them to the client-side
 * `Home` component, which owns all editor state.
 */
import Home from "@/components/Home";

interface PageProps {
  searchParams: Promise<{ template?: string; resumeId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { template, resumeId } = await searchParams;

  return <Home initialTemplateId={template} initialResumeId={resumeId} />;
}
