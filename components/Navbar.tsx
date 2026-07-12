/**
 * Site-wide top navigation bar: the app name/home link plus the theme
 * toggle and language selector, rendered once in the root layout.
 */
import Link from "next/link";
import LanguageSelect from "@/components/LanguageSelect";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  return (
    <div className="navbar border-base-300 bg-base-100 border-b px-4">
      <div className="flex-1">
        <Link href="/" className="text-lg font-semibold">
          QuickResumeBuilder.online
        </Link>
      </div>
      <div className="flex flex-none items-center gap-1">
        <ThemeToggle />
        <LanguageSelect />
      </div>
    </div>
  );
}
