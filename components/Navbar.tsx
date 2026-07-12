"use client";

/**
 * Site-wide top navigation bar: the app name/home link, the editor-only
 * Templates/Features/Colours/Typography/Font Size buttons (shown only on
 * `/app`, in the center of the same row), plus the theme toggle and
 * language selector. Rendered once in the root layout so it appears on
 * every route.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import ColoursDropdown from "@/components/navbar/ColoursDropdown";
import FeaturesDropdown from "@/components/navbar/FeaturesDropdown";
import FontSizeDropdown from "@/components/navbar/FontSizeDropdown";
import TemplatesDropdown from "@/components/navbar/TemplatesDropdown";
import TypographyDropdown from "@/components/navbar/TypographyDropdown";
import LanguageSelect from "@/components/LanguageSelect";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const isEditorRoute = usePathname() === "/app";

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
          no such clipping side effect. */}
      <div className="flex flex-1 items-center">
        <Link href="/" className="text-lg font-semibold whitespace-nowrap">
          QuickResumeBuilder.online
        </Link>
      </div>

      {isEditorRoute && (
        <div className="flex shrink-0 items-center gap-1">
          <TemplatesDropdown />
          <FeaturesDropdown />
          <ColoursDropdown />
          <TypographyDropdown />
          <FontSizeDropdown />
        </div>
      )}

      <div className="flex flex-1 shrink-0 items-center justify-end gap-1">
        <ThemeToggle />
        <LanguageSelect />
      </div>
    </div>
  );
}
