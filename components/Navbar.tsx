import Link from "next/link";
import LanguageSelect from "@/components/LanguageSelect";

export default function Navbar() {
  return (
    <div className="navbar border-base-300 bg-base-100 border-b px-4">
      <div className="flex-1">
        <Link href="/" className="text-lg font-semibold">
          QuickResumeBuilder.online
        </Link>
      </div>
      <div className="flex-none">
        <LanguageSelect />
      </div>
    </div>
  );
}
