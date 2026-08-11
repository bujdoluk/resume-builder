
import type { Metadata } from "next";
import MyCoverLettersPageContent from "@/components/cover-letter/MyCoverLettersPageContent";

export const metadata: Metadata = {
  title: "My Cover Letters",
  alternates: {
    canonical: "/my-cover-letters",
  },
};

export default function Page() {
  return <MyCoverLettersPageContent />;
}
