"use client";

import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Resume from "@/components/Resume";
import Sidebar from "@/components/Sidebar";
import {
  emptyResumeData,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
} from "@/lib/resumeData";
import {
  defaultTemplateId,
  templates,
  type TemplateId,
} from "@/lib/templates";

const allSections: SectionKey[] = [
  "workHistory",
  "education",
  "skills",
  "certifications",
  "languages",
  "interests",
];

// Certifications is opt-in: it's a valid section for any template, but
// starts out of sectionOrder so it only appears once added via the
// sidebar's "Add Section" list.
const defaultSectionOrder: SectionKey[] = allSections.filter(
  (key) => key !== "certifications",
);

function resolveTemplateId(id: string | undefined): TemplateId {
  return templates.some((template) => template.id === id)
    ? (id as TemplateId)
    : defaultTemplateId;
}

interface HomeProps {
  initialTemplateId?: string;
}

export default function Home({ initialTemplateId }: HomeProps) {
  const templateId = resolveTemplateId(initialTemplateId);
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [sectionOrder, setSectionOrder] =
    useState<SectionKey[]>(defaultSectionOrder);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const previewRef = useRef<HTMLDialogElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

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

  function handleCertificationsChange(certifications: CertificationEntry[]) {
    setData((prev) => ({ ...prev, certifications }));
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

  function handlePrint() {
    previewRef.current?.showModal();
    window.print();
  }

  async function handleDownloadPdf() {
    const source = printAreaRef.current;
    if (!source || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      // The preview lives inside a <dialog>, which is display:none while
      // closed, so it must be open for html2canvas to capture real content.
      const wasOpen = previewRef.current?.open ?? false;
      if (!wasOpen) previewRef.current?.showModal();

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(source, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("resume.pdf");

      if (!wasOpen) previewRef.current?.close();
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  const hiddenSections = allSections.filter(
    (key) => !sectionOrder.includes(key),
  );

  const TemplateComponent =
    templates.find((template) => template.id === templateId)?.component ??
    templates[0].component;

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
            onCertificationsChange={handleCertificationsChange}
            onLanguagesChange={handleLanguagesChange}
            onInterestsChange={handleInterestsChange}
            sectionOrder={sectionOrder}
            onRemoveSection={removeSection}
            templateId={templateId}
          />

          <div className="sticky top-8 flex flex-col gap-2 self-start">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => previewRef.current?.showModal()}
            >
              Preview
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handlePrint}
            >
              Print / Save PDF
            </button>

            <button
              type="button"
              className="btn btn-outline"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
            >
              {isGeneratingPdf ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Download PDF"
              )}
            </button>
          </div>
        </div>
      </div>

      <Sidebar hiddenSections={hiddenSections} onAddSection={addSection} />

      <dialog ref={previewRef} className="modal">
        <div
          id="print-area"
          ref={printAreaRef}
          className="modal-box max-h-[90vh]! w-fit! max-w-none! overflow-y-auto! bg-transparent! p-0! shadow-none!"
        >
          <TemplateComponent data={data} sectionOrder={sectionOrder} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
