
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/my-resumes",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyResumesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
