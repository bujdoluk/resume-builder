"use client";

import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Preview from "@/components/Preview";
import Resume, {
  emptyResumeData,
  type LanguageEntry,
  type ResumeData,
} from "@/components/Resume";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const previewRef = useRef<HTMLDialogElement>(null);

  function handleChange(field: keyof ResumeData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function handleLanguagesChange(languages: LanguageEntry[]) {
    setData((prev) => ({ ...prev, languages }));
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <Navbar />

        <div className="bg-base-200 flex flex-1 justify-center gap-8 p-8">
          <Resume
            data={data}
            onChange={handleChange}
            onLanguagesChange={handleLanguagesChange}
          />

          <button
            type="button"
            className="btn btn-primary btn-lg self-start"
            onClick={() => previewRef.current?.showModal()}
          >
            Preview
          </button>
        </div>
      </div>

      <Sidebar />

      <dialog ref={previewRef} className="modal">
        <div className="modal-box max-h-[90vh]! w-fit! max-w-none! overflow-y-auto! bg-transparent! p-0! shadow-none!">
          <Preview data={data} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
