import Home from "@/components/Home";

interface PageProps {
  searchParams: Promise<{ template?: string; resumeId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { template, resumeId } = await searchParams;

  return <Home initialTemplateId={template} initialResumeId={resumeId} />;
}
