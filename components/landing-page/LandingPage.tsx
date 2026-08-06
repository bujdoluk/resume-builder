"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Footer from "@/components/landing-page/Footer";
import PricingSection from "@/components/landing-page/PricingSection";
import Testimonials from "@/components/landing-page/Testimonials";
import {
  AtsCheckerIcon,
  CustomizationIcon,
  DownloadIcon,
  EmailIcon,
  LanguagesIcon,
  MyCoverLettersIcon,
  MyResumesIcon,
  TemplatesIcon,
} from "@/components/Icons";
import { TESTIMONIAL_PULSE_INTERVAL_MS, TESTIMONIAL_PULSE_START_DELAY_MS } from "@/lib/constants";

const features = [
  { key: "templates", icon: TemplatesIcon },
  { key: "coverLetter", icon: MyCoverLettersIcon },
  { key: "customization", icon: CustomizationIcon },
  { key: "pdf", icon: DownloadIcon },
  { key: "ats", icon: AtsCheckerIcon },
  { key: "email", icon: EmailIcon },
  { key: "languages", icon: LanguagesIcon },
  { key: "saveResumes", icon: MyResumesIcon },
] as const;

export default function LandingPage() {
  const { t } = useTranslation();
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const startTimer = setTimeout(() => {
      setPulseCount((count) => count + 1);
      interval = setInterval(() => {
        setPulseCount((count) => count + 1);
      }, TESTIMONIAL_PULSE_INTERVAL_MS);
    }, TESTIMONIAL_PULSE_START_DELAY_MS);

    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden">
      <div className="bg-primary text-primary-content">
        <div className="mx-auto grid min-h-[75vh] max-w-5xl items-center gap-10 px-8 py-20 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold sm:text-5xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg opacity-90 lg:mx-0">
              {t("landing.heroSubtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                key={pulseCount}
                href="/app"
                className={`btn btn-lg border-none bg-black text-white hover:bg-neutral-800 ${pulseCount > 0 ? "cta-attention" : ""}`}
              >
                {t("landing.ctaStart")}
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <Image
              src="/images/resume_preview.webp"
              alt="Example resume built with QuickResumeBuilder.online"
              width={1588}
              height={2246}
              priority
              className="h-auto max-h-[65vh] w-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>

      <div className="bg-base-200 flex-1">
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-6 px-8 py-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="bg-base-100 border-base-300 rounded-lg border p-6"
            >
              <Icon className="text-primary h-8 w-8 stroke-current" />
              <h2 className="mt-3 font-semibold">
                {t(`landing.features.${key}.title`)}
              </h2>
              <p className="text-base-content/70 mt-2 text-sm">
                {t(`landing.features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <PricingSection />

      <Testimonials />

      <div className="bg-base-200 py-20">
        <div className="mx-auto max-w-2xl px-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-base-content/70 mt-3 text-lg">
            {t("landing.ctaSubtitle")}
          </p>
          <Link href="/app" className="btn btn-primary btn-lg mt-6">
            {t("landing.ctaStart")}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
