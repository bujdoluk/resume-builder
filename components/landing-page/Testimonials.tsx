"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";

const testimonials = ["sarah", "james", "elena", "noah"] as const;

export default function Testimonials() {
  const { t } = useTranslation();
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollTestimonials(direction: 1 | -1) {
    const container = carouselRef.current;
    if (!container) return;
    const item = container.querySelector<HTMLElement>(".carousel-item");
    const amount = item ? item.offsetWidth + 16 : container.clientWidth;
    container.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  return (
    <div className="bg-primary py-20">
      <h2 className="text-primary-content mx-auto max-w-3xl px-8 text-center text-2xl font-bold sm:text-3xl">
        {t("landing.testimonialsTitle")}
      </h2>

      <div className="relative mx-auto mt-10 max-w-5xl px-8">
        <button
          type="button"
          className="btn btn-circle btn-neutral absolute top-1/2 left-0 z-10 h-12 w-12 -translate-y-1/2 border-none text-2xl"
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
          className="btn btn-circle btn-neutral absolute top-1/2 right-0 z-10 h-12 w-12 -translate-y-1/2 border-none text-2xl"
          aria-label={t("aria.nextTestimonial")}
          onClick={() => scrollTestimonials(1)}
        >
          ❯
        </button>
      </div>
    </div>
  );
}
