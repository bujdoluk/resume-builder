import Home from "@/components/Home";

interface PageProps {
  searchParams: Promise<{ template?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { template } = await searchParams;

  return <Home initialTemplateId={template} />;
}
