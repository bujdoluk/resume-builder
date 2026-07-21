
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/templates",
  },
};

export default function TemplatesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
