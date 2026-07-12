/**
 * Shared layout for the `/app`, `/my-resumes`, and `/templates` routes:
 * renders the persistent editor `Sidebar` alongside the page content.
 */
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
