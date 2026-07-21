
import type { Metadata } from "next";
import LoginPage from "@/components/LoginPage";

const title = "Log in — QuickResumeBuilder.online";
const description = "Log in or create an account to save your resumes and cover letters.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
  },
  openGraph: {
    title,
    description,
    url: "/login",
    siteName: "QuickResumeBuilder.online",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Page() {
  return <LoginPage />;
}
