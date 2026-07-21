"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import AuthButton from "@/components/navbar/AuthButton";
import ColoursDropdown from "@/components/navbar/ColoursDropdown";
import CoverLetterFeaturesDropdown from "@/components/navbar/CoverLetterFeaturesDropdown";
import CoverLetterTemplatesDropdown from "@/components/navbar/CoverLetterTemplatesDropdown";
import FeaturesDropdown from "@/components/navbar/FeaturesDropdown";
import FontSizeDropdown from "@/components/navbar/FontSizeDropdown";
import TemplatesDropdown from "@/components/navbar/TemplatesDropdown";
import TypographyDropdown from "@/components/navbar/TypographyDropdown";
import LanguageSelect from "@/components/LanguageSelect";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isEditorRoute = pathname === "/app";
  const isCoverLetterRoute = pathname === "/cover-letter";

  return (
    <div className="navbar border-base-300 bg-base-100 flex-wrap gap-2 border-b px-4">
      <div className="order-1 flex flex-1 items-center md:order-none">
        <Link href="/" className="text-lg font-semibold whitespace-nowrap">
          QuickResumeBuilder.online
        </Link>
      </div>

      {isEditorRoute && (
        <div className="order-3 flex basis-full shrink-0 flex-wrap items-center justify-center gap-1 md:order-none md:basis-auto">
          <TemplatesDropdown />
          <FeaturesDropdown />
          <ColoursDropdown />
          <TypographyDropdown />
          <FontSizeDropdown />
        </div>
      )}

      {isCoverLetterRoute && (
        <div className="order-3 flex basis-full shrink-0 flex-wrap items-center justify-center gap-1 md:order-none md:basis-auto">
          <CoverLetterTemplatesDropdown />
          <CoverLetterFeaturesDropdown />
          <ColoursDropdown />
          <TypographyDropdown />
          <FontSizeDropdown />
        </div>
      )}

      <div className="order-2 flex flex-1 shrink-0 items-center justify-end gap-1 md:order-none">
        <Link href="/blog" className="link link-hover mr-2">
          {t("blog.navLabel")}
        </Link>
        <ThemeToggle />
        <LanguageSelect />
        <AuthButton />
      </div>
    </div>
  );
}
