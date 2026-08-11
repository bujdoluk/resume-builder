
import type { Metadata } from "next";
import TemplatesPageContent from "@/components/TemplatesPageContent";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse resume templates — Basic, Modern, Minimal, Elegant, and Classic.",
  alternates: {
    canonical: "/templates",
  },
};

export default function Page() {
  return <TemplatesPageContent />;
}
