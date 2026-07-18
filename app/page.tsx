/**
 * Root `/` route: the public marketing landing page. Defines page-specific
 * SEO metadata (title/description/OpenGraph/Twitter) and a `WebApplication`
 * JSON-LD block, then renders `LandingPage`.
 */
import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

const title = "QuickResumeBuilder.online — Free Online Resume Builder";
const description =
  "Build a professional resume in minutes for free. Pick a template, customize colors, fonts, and font size, then download a polished PDF straight from your browser — no sign-up required.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "QuickResumeBuilder.online",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QuickResumeBuilder.online",
  url: "https://www.quickresumebuilder.online/",
  description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
