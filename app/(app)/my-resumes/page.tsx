
import type { Metadata } from "next";
import MyResumesPageContent from "@/components/resumes/MyResumesPageContent";

export const metadata: Metadata = {
  title: "My Resumes",
  alternates: {
    canonical: "/my-resumes",
  },
};

export default function Page() {
  return <MyResumesPageContent />;
}
