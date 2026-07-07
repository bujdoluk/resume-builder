import Link from "next/link";

export default function Navbar() {
  return (
    <div className="navbar border-base-300 bg-base-100 border-b px-4">
      <div className="flex-none lg:hidden">
        <label
          htmlFor="sidebar-drawer"
          aria-label="Open sidebar"
          className="btn btn-square btn-ghost"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </label>
      </div>
      <div className="flex-1">
        <Link href="/" className="text-lg font-semibold">
          QuickResumeBuilder.online
        </Link>
      </div>
    </div>
  );
}
