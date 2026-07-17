"use client";

/**
 * Site-wide top navigation bar: the app name/home link, the editor-only
 * Templates/Features/Colours/Typography/Font Size buttons (shown on `/app`
 * for the resume and on `/cover-letter` for the cover letter, in the center
 * of the same row), plus the theme toggle and language selector. Colours/
 * Typography/Font Size are shared as-is between the two editors (same
 * global `color`/`font`/`fontSize` AppState); Templates/Features are
 * cover-letter-specific variants since they depend on resume-only types
 * (TemplateId, FieldKey). Rendered once in the root layout so it appears on
 * every route — including the landing page, where `AuthButton` shows the
 * login button.
 */
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
          QuickResumeBuilder.com
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
