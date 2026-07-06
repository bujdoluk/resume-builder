import Navbar from "@/components/Navbar";
import Resume from "@/components/Resume";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <Navbar />

        <div className="bg-base-200 flex flex-1 justify-center p-8">
          <Resume />
        </div>
      </div>

      <Sidebar />
    </div>
  );
}
