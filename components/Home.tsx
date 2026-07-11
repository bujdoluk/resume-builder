"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { DownloadIcon, SaveIcon } from "@/components/Icons";
import Resume from "@/components/Resume";
import { defaultFontSizeKey } from "@/lib/fontSize";
import {
  emptyResumeData,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SimpleEntry,
  type WorkEntry,
} from "@/lib/resumeData";
import { createClient } from "@/lib/supabase/client";
import { getResume, saveResume } from "@/lib/supabase/resumes";
import { ensureUserId } from "@/lib/supabase/session";
import {
  defaultTemplateId,
  templates,
  type TemplateId,
} from "@/lib/templates";

function resolveTemplateId(id: string | undefined): TemplateId {
  return templates.some((template) => template.id === id)
    ? (id as TemplateId)
    : defaultTemplateId;
}

// The unsaved, in-progress resume (no resumeId yet) is mirrored to
// localStorage so its content survives switching templates — which
// navigates away to /templates and back, remounting Home — and closing the
// browser entirely. Once the user explicitly saves, the data has a durable
// home under its own resumeId and this scratch slot is cleared so a later
// blank resume doesn't inherit it.
const DRAFT_STORAGE_KEY = "resumeBuilder:draft";

function loadDraft(): ResumeData | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResumeData) : null;
  } catch {
    return null;
  }
}

function saveDraft(data: ResumeData) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota/serialization errors — the draft is a convenience, not
    // the resume's source of truth.
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

interface HomeProps {
  initialTemplateId?: string;
  initialResumeId?: string;
}

export default function Home({
  initialTemplateId,
  initialResumeId,
}: HomeProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const templateId = resolveTemplateId(initialTemplateId);
  const {
    color,
    setColor,
    font,
    setFont,
    fontSize,
    setFontSize,
    sectionOrder,
    setSectionOrder,
    visibleFields,
    setVisibleFields,
  } = useAppState();
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(
    initialResumeId ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const previewRef = useRef<HTMLDialogElement>(null);
  const pdfExportRef = useRef<HTMLDivElement>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!initialResumeId) return;
    let cancelled = false;

    getResume(supabase, initialResumeId).then((row) => {
      if (!row || cancelled) return;
      setData(row.data);
      setColor(row.color);
      setFont(row.font);
      setFontSize(row.fontSize ?? defaultFontSizeKey);
      setSectionOrder(row.sectionOrder);
      setVisibleFields(row.visibleFields);
    });

    return () => {
      cancelled = true;
    };
    // Only ever re-run if the id in the URL changes (e.g. opening a
    // different saved resume from "My resumes") — the setters are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialResumeId, supabase]);

  // Restore the unsaved scratch draft once on mount — only when we're not
  // already loading a specific saved resume by id (the effect above).
  useEffect(() => {
    if (initialResumeId) return;
    const draft = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setData(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror every edit to localStorage so it survives switching templates
  // (which navigates away from /app and remounts this component) and
  // closing the browser, as long as it hasn't been explicitly saved yet.
  // Skipping while `data` is still reference-equal to the initial empty
  // value avoids a real race: this effect and the restore effect above both
  // fire on mount, and in dev, React's Strict Mode invokes each of them
  // twice before the restored `setData` has actually landed as a render —
  // without this guard, one of those extra passes writes the stale empty
  // value right over the draft it just read.
  useEffect(() => {
    if (initialResumeId) return;
    if (data === emptyResumeData) return;
    saveDraft(data);
  }, [data, initialResumeId]);

  function handleChange(field: keyof ResumeData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function handleWorkHistoryChange(workExperience: WorkEntry[]) {
    setData((prev) => ({ ...prev, workExperience }));
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

  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const userId = await ensureUserId(supabase);
      const row = await saveResume(supabase, {
        id: resumeId,
        userId,
        templateId,
        color,
        font,
        fontSize,
        sectionOrder,
        visibleFields,
        data,
      });
      setResumeId(row.id);
      router.replace(`/app?resumeId=${row.id}&template=${templateId}`);
      clearDraft();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (error) {
      console.error(error);
      alert(t("myResumes.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadPdf() {
    const source = pdfExportRef.current;
    if (!source || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
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
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  const templateDefinition =
    templates.find((template) => template.id === templateId) ?? templates[0];
  const TemplateComponent = templateDefinition.component;
  const MobileFormComponent = templateDefinition.mobileFormComponent;

  function renderActionButtons(className: string) {
    return (
      <div className={className}>
        <button
          type="button"
          className="btn btn-primary btn-lg flex-1 md:flex-none md:w-48"
          onClick={() => previewRef.current?.showModal()}
        >
          {t("buttons.preview")}
        </button>

        <button
          type="button"
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          disabled={isSaving}
          onClick={handleSave}
        >
          {isSaving ? (
            <span className="loading loading-spinner loading-sm" />
          ) : justSaved ? (
            t("buttons.saved")
          ) : (
            <>
              <SaveIcon className="h-5 w-5 stroke-current" />
              {t("buttons.save")}
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          disabled={isGeneratingPdf}
          onClick={handleDownloadPdf}
        >
          {isGeneratingPdf ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <>
              <DownloadIcon className="h-5 w-5 stroke-current" />
              {t("buttons.download")}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: plain one-column form, actions pinned at the bottom */}
      <div className="bg-base-200 flex flex-1 flex-col gap-6 p-4 md:hidden">
        <MobileFormComponent
          data={data}
          onChange={handleChange}
          onWorkHistoryChange={handleWorkHistoryChange}
          onEducationChange={handleEducationChange}
          onSkillsChange={handleSkillsChange}
          onCertificationsChange={handleCertificationsChange}
          onLanguagesChange={handleLanguagesChange}
          onInterestsChange={handleInterestsChange}
          sectionOrder={sectionOrder}
          onReorderSections={setSectionOrder}
          visibleFields={visibleFields}
          onReorderFields={setVisibleFields}
          color={color}
        />
        {renderActionButtons("flex gap-2")}
      </div>

      {/* Tablet/desktop: WYSIWYG canvas + action column (unchanged) */}
      <div className="bg-base-200 hidden flex-1 flex-col items-center gap-6 p-4 md:flex lg:flex-row lg:items-start lg:justify-center lg:gap-8 lg:p-8">
        <div className="w-full min-w-0 overflow-x-auto lg:w-auto">
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
            onReorderSections={setSectionOrder}
            templateId={templateId}
            color={color}
            font={font}
            fontSize={fontSize}
            visibleFields={visibleFields}
            onReorderFields={setVisibleFields}
          />
        </div>

        {renderActionButtons(
          "order-first flex flex-col gap-2 lg:sticky lg:top-8 lg:order-last lg:self-start",
        )}
      </div>

      <dialog ref={previewRef} className="modal">
        <div
          id="pdf-area"
          className="modal-box max-h-[90vh]! w-[95vw]! max-w-[95vw]! overflow-auto! bg-transparent! p-0! shadow-none! lg:w-fit! lg:max-w-none!"
        >
          <TemplateComponent
            data={data}
            sectionOrder={sectionOrder}
            color={color}
            font={font}
            fontSize={fontSize}
            visibleFields={visibleFields}
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <div
        ref={pdfExportRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-[-9999px]"
      >
        <TemplateComponent
          data={data}
          sectionOrder={sectionOrder}
          color={color}
          font={font}
          fontSize={fontSize}
          visibleFields={visibleFields}
        />
      </div>
    </>
  );
}
