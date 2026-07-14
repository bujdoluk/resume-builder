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
 * every route.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isEditorRoute = pathname === "/app";
  const isCoverLetterRoute = pathname === "/cover-letter";

  return (
    <div className="navbar border-base-300 bg-base-100 flex-wrap gap-2 border-b px-4">
      {/* The left and right zones share an equal flex-grow (flex-1), so
          whatever space is left over after the fixed-size middle button
          group splits evenly between them — pushing the buttons to the
          true center of the bar instead of just sitting next to the app
          name. On a narrow viewport where everything genuinely doesn't
          fit on one line, the row wraps (`flex-wrap`) instead of
          scrolling — `overflow-x-auto` was tried here but had to be
          reverted: setting overflow on one axis forces the other axis's
          computed value to `auto` too, which clipped the dropdown panels
          below (they render outside the navbar's own box). Wrapping has
          no such clipping side effect.

          On mobile, plain wrapping isn't enough on its own: since it fills
          each line greedily in DOM order, the middle button group (when
          present) could end up splitting across the app name's row or the
          theme/language row unpredictably depending on exactly how much
          text/how many buttons fit. `order` + `basis-full` force a
          deliberate 2-row layout instead — name+theme/language on row 1
          (the theme/language zone is reordered to visually come right
          after the name, ahead of the middle group), the middle button
          group alone on row 2 (its `basis-full` always overflows any
          remaining row-1 space, so it's guaranteed to wrap onto its own
          line). DOM order is left as name → middle → right, so
          `md:order-none` on all three cleanly restores the original
          single-row desktop layout (tied order:0 falls back to DOM
          order). */}
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
        <ThemeToggle />
        <LanguageSelect />
      </div>
    </div>
  );
}
