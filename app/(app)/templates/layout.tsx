/**
 * `/templates` is a client component (interactive gallery), so its canonical
 * URL must be declared in this sibling server-component layout instead of
 * the page itself.
 */
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
