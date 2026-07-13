"use client";

/**
 * Public marketing page rendered at `/`: hero section with a "start
 * building" CTA (which pulses periodically to draw attention) and a grid of
 * feature highlights, followed by the shared `Footer`.
 */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import {
  CustomizationIcon,
  DownloadIcon,
  LanguagesIcon,
  MyResumesIcon,
  TemplatesIcon,
} from "@/components/Icons";

const features = [
  { key: "templates", icon: TemplatesIcon },
  { key: "customization", icon: CustomizationIcon },
  { key: "pdf", icon: DownloadIcon },
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
      }, 7000);
    }, 3000);

    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden">
      <div className="bg-base-200 flex-1">
        <div className="relative">
          <Image
            src="/images/app_background.png"
            alt="Resume preview picture"
            aria-hidden="true"
            width={1752}
            height={1123}
            priority
            className="pointer-events-none absolute top-0 left-[-200] hidden h-[70vh] w-[60vw] rotate-[0deg] object-cover object-top opacity-30 select-none lg:block"
          />

          <Image
            src="/images/Resume_lp_background.png"
            alt="Resume preview picture"
            aria-hidden="true"
            width={1752}
            height={1123}
            priority
            className="pointer-events-none absolute top-10 right-[-180] hidden h-[60vh] w-[50vw] rotate-[5deg] object-cover object-top opacity-30 select-none lg:block"
          />

          <div className="relative mx-auto max-w-3xl px-8 py-20 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="text-base-content/70 mx-auto mt-4 max-w-xl text-lg">
              {t("landing.heroSubtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                key={pulseCount}
                href="/app"
                className={`btn btn-primary btn-lg ${pulseCount > 0 ? "cta-attention" : ""}`}
              >
                {t("landing.ctaStart")}
              </Link>
            </div>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-6 px-8 pb-20 sm:grid-cols-2 lg:grid-cols-3">
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

      <Footer />
    </div>
  );
}
