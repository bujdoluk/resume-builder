
import type { Metadata } from "next";
import ResetPasswordPage from "@/components/ResetPasswordPage";

const title = "Reset password — QuickResumeBuilder.online";
const description = "Choose a new password for your account.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/reset-password",
  },
  robots: {
    index: false,
  },
  openGraph: {
    title,
    description,
    url: "/reset-password",
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
  return <ResetPasswordPage />;
}
