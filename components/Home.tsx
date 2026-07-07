"use client";

import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Preview from "@/components/Preview";
import Resume, {
  emptyResumeData,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
} from "@/components/Resume";
import Sidebar from "@/components/Sidebar";

const allSections: SectionKey[] = [
  "workHistory",
  "education",
  "skills",
  "languages",
  "interests",
];

export default function Home() {
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(allSections);
  const previewRef = useRef<HTMLDialogElement>(null);

  function handleChange(field: keyof ResumeData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function handleWorkHistoryChange(workHistory: WorkEntry[]) {
    setData((prev) => ({ ...prev, workHistory }));
  }

  function handleEducationChange(education: EducationEntry[]) {
    setData((prev) => ({ ...prev, education }));
  }

  function handleSkillsChange(skills: SimpleEntry[]) {
    setData((prev) => ({ ...prev, skills }));
  }

  function handleLanguagesChange(languages: LanguageEntry[]) {
    setData((prev) => ({ ...prev, languages }));
  }

  function handleInterestsChange(interests: SimpleEntry[]) {
    setData((prev) => ({ ...prev, interests }));
  }

  function removeSection(key: SectionKey) {
    setSectionOrder((prev) => prev.filter((section) => section !== key));
    setData((prev) => ({ ...prev, [key]: [] }));
  }

  function addSection(key: SectionKey) {
    setSectionOrder((prev) => [...prev, key]);
  }

  const hiddenSections = allSections.filter(
    (key) => !sectionOrder.includes(key),
  );

  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <Navbar />

        <div className="bg-base-200 flex flex-1 justify-center gap-8 p-8">
          <Resume
            data={data}
            onChange={handleChange}
            onWorkHistoryChange={handleWorkHistoryChange}
            onEducationChange={handleEducationChange}
            onSkillsChange={handleSkillsChange}
            onLanguagesChange={handleLanguagesChange}
            onInterestsChange={handleInterestsChange}
            sectionOrder={sectionOrder}
            onRemoveSection={removeSection}
          />

          <button
            type="button"
            className="btn btn-primary btn-lg sticky top-8 self-start"
            onClick={() => previewRef.current?.showModal()}
          >
            Preview
          </button>
        </div>
      </div>

      <Sidebar hiddenSections={hiddenSections} onAddSection={addSection} />

      <dialog ref={previewRef} className="modal">
        <div className="modal-box max-h-[90vh]! w-fit! max-w-none! overflow-y-auto! bg-transparent! p-0! shadow-none!">
          <Preview data={data} sectionOrder={sectionOrder} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
