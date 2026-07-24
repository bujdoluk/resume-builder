"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import PricingSection from "@/components/landing-page/PricingSection";
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

const testimonials = ["sarah", "james", "elena", "noah"] as const;

export default function LandingPage() {
  const { t } = useTranslation();
  const [pulseCount, setPulseCount] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollTestimonials(direction: 1 | -1) {
    const container = carouselRef.current;
    if (!container) return;
    const item = container.querySelector<HTMLElement>(".carousel-item");
    const amount = item ? item.offsetWidth + 16 : container.clientWidth;
    container.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

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
      <div className="bg-base-200 flex-1">
        <div className="relative">
          <Image
            src="/images/app_background.webp"
            alt="Resume preview picture"
            aria-hidden="true"
            width={1752}
            height={1123}
            priority
            className="pointer-events-none absolute top-0 left-[-180] hidden h-[80vh] w-[60vw] rotate-[0deg] object-cover object-top opacity-30 select-none lg:block"
          />

          <Image
            src="/images/Resume_lp_background.webp"
            alt="Resume preview picture"
            aria-hidden="true"
            width={1752}
            height={1123}
            priority
            className="pointer-events-none absolute top-10 right-[-180] hidden h-[100vh] w-[50vw] rotate-[5deg] object-cover object-top opacity-30 select-none lg:block"
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

      <PricingSection />

      <div className="bg-base-300 py-20">
        <h2 className="mx-auto max-w-3xl px-8 text-center text-2xl font-bold sm:text-3xl">
          {t("landing.testimonialsTitle")}
        </h2>

        <div className="relative mx-auto mt-10 max-w-5xl px-8">
          <button
            type="button"
            className="btn btn-circle absolute top-1/2 left-0 z-10 h-12 w-12 -translate-y-1/2 text-2xl"
            aria-label={t("aria.previousTestimonial")}
            onClick={() => scrollTestimonials(-1)}
          >
            ❮
          </button>

          <div ref={carouselRef} className="carousel w-full gap-2 rounded-lg">
            {testimonials.map((key) => (
              <div key={key} className="carousel-item w-full sm:w-1/2 lg:w-1/3">
                <div className="bg-base-100 border-base-300 flex w-full flex-col items-center gap-4 rounded-lg border p-6 text-center">
                  <div className="text-warning text-lg" aria-hidden="true">
                    ★★★★★
                  </div>
                  <p className="text-base-content/80 text-sm italic">
                    “{t(`landing.testimonials.${key}.quote`)}”
                  </p>
                  <div>
                    <p className="font-semibold">
                      {t(`landing.testimonials.${key}.name`)}
                    </p>
                    <p className="text-base-content/60 text-sm">
                      {t(`landing.testimonials.${key}.role`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-circle absolute top-1/2 right-0 z-10 h-12 w-12 -translate-y-1/2 text-2xl"
            aria-label={t("aria.nextTestimonial")}
            onClick={() => scrollTestimonials(1)}
          >
            ❯
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
