"use client";

/**
 * Top-level resume builder page component rendered by the `/app` route:
 * owns the resume's data state, loads a saved resume by id or restores an
 * unsaved draft from localStorage, and renders either the mobile editing
 * template or the desktop drag-and-drop `Resume` canvas alongside Preview/
 * Save/Download actions. Save persists to Supabase; Download generates a
 * PDF client-side via `@react-pdf/renderer` using the matching
 * `pdfTemplates` entry for the current template. The cover letter
 * counterpart is `CoverLetterBuilder.tsx`.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/nextjs";
import { useAppState } from "@/components/AppState";
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/ConfirmDialog";
import DownloadButton from "@/components/DownloadButton";
import EmailButton from "@/components/EmailButton";
import ExportFormatMenu from "@/components/ExportFormatMenu";
import { InfoIcon, SaveIcon } from "@/components/Icons";
import PreviewModal, {
  type PreviewModalHandle,
} from "@/components/PreviewModal";
import PrintButton from "@/components/PrintButton";
import Resume from "@/components/resumes/Resume";
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import type { ExportFormat } from "@/lib/exportFormat";
import { defaultFontSizeKey } from "@/lib/fontSize";
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
import { pdfTemplates } from "@/lib/pdf/templates";
import { createClient } from "@/lib/supabase/client";
import { countResumes, getResume, saveResume } from "@/lib/supabase/resumes";
import { ensureUserId } from "@/lib/supabase/session";
import { FREE_TIER_LIMITS, getSubscription, isPaidPlan } from "@/lib/supabase/subscriptions";
import {
  defaultTemplateId,
  templates,
  type TemplateId,
} from "@/lib/templates";
import { generateResumeText } from "@/lib/text/resumeText";

function resolveTemplateId(id: string | undefined): TemplateId {
  return templates.some((template) => template.id === id)
    ? (id as TemplateId)
    : defaultTemplateId;
}

// The unsaved, in-progress resume (no resumeId yet) is mirrored to
// localStorage so its content survives switching templates — which
// navigates away to /templates and back, remounting ResumeBuilder — and
// closing the browser entirely. Once the user explicitly saves, the data
// has a durable home under its own resumeId and this scratch slot is
// cleared so a later blank resume doesn't inherit it.
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

interface ResumeBuilderProps {
  initialTemplateId?: string;
  initialResumeId?: string;
}

export default function ResumeBuilder({
  initialTemplateId,
  initialResumeId,
}: ResumeBuilderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    templateId,
    setTemplateId,
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
    modernSectionZones,
    setModernSectionZones,
    notifyResumeListChanged,
    setLastEditorPath,
  } = useAppState();
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [resumeId, setResumeId] = useState<string | null>(
    initialResumeId ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const previewRef = useRef<PreviewModalHandle>(null);
  const saveDialogRef = useRef<SaveResumeDialogHandle>(null);
  const upgradeDialogRef = useRef<ConfirmDialogHandle>(null);
  const [supabase] = useState(() => createClient());
  const exportText = generateResumeText({ data, sectionOrder, visibleFields });

  // Applies the URL's `?template=` param whenever it changes — e.g. landing
  // here fresh from the `/templates` gallery, or opening a saved resume via
  // its "My Resumes" edit link (which encodes the resume's own template).
  // Switching templates *from within* the editor (the Navbar's Templates
  // dropdown) only ever calls `setTemplateId` directly and never touches
  // this prop, so it doesn't fight with that.
  useEffect(() => {
    setTemplateId(resolveTemplateId(initialTemplateId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTemplateId]);

  // Keeps the Sidebar's "Back to editor" link pointed at this exact
  // resume/template pair, so navigating away to /my-resumes or /templates
  // and back returns here instead of a blank editor.
  useEffect(() => {
    setLastEditorPath(
      resumeId
        ? `/app?resumeId=${resumeId}&template=${templateId}`
        : `/app?template=${templateId}`,
    );
  }, [resumeId, templateId, setLastEditorPath]);

  useEffect(() => {
    if (!initialResumeId) return;
    let cancelled = false;

    getResume(supabase, initialResumeId).then((row) => {
      if (!row || cancelled) return;
      setData(row.data);
      setTemplateId(row.templateId);
      setColor(row.color);
      setFont(row.font);
      setFontSize(row.fontSize ?? defaultFontSizeKey);
      setSectionOrder(row.sectionOrder);
      setVisibleFields(row.visibleFields);
      setModernSectionZones(row.modernSectionZones);
      setResumeName(row.name);
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

  async function handleNewResume() {
    const userId = await ensureUserId(supabase);
    const [subscription, existingCount] = await Promise.all([
      getSubscription(supabase, userId),
      countResumes(supabase, userId),
    ]);
    if (!isPaidPlan(subscription.plan) && existingCount >= FREE_TIER_LIMITS.resumes) {
      const viewPlans = await upgradeDialogRef.current?.open({
        message: t("pricing.resumeLimitReached", { limit: FREE_TIER_LIMITS.resumes }),
        confirmLabel: t("pricing.viewPlans"),
      });
      if (viewPlans) router.push("/#pricing");
      return;
    }

    setData(emptyResumeData);
    setResumeId(null);
    setResumeName("");
    clearDraft();
    router.replace(`/app?template=${templateId}`);
  }

  async function handleSave() {
    if (isSaving) return;

    let nameToSave = resumeName;
    if (!nameToSave) {
      const chosenName = await saveDialogRef.current?.open(resumeName);
      if (!chosenName) return;
      nameToSave = chosenName;
    }

    try {
      const userId = await ensureUserId(supabase);

      if (!resumeId) {
        const [subscription, existingCount] = await Promise.all([
          getSubscription(supabase, userId),
          countResumes(supabase, userId),
        ]);
        if (!isPaidPlan(subscription.plan) && existingCount >= FREE_TIER_LIMITS.resumes) {
          const viewPlans = await upgradeDialogRef.current?.open({
            message: t("pricing.resumeLimitReached", { limit: FREE_TIER_LIMITS.resumes }),
            confirmLabel: t("pricing.viewPlans"),
          });
          if (viewPlans) router.push("/#pricing");
          return;
        }
      }

      setIsSaving(true);
      const row = await saveResume(supabase, {
        id: resumeId,
        userId,
        name: nameToSave,
        templateId,
        color,
        font,
        fontSize,
        sectionOrder,
        visibleFields,
        modernSectionZones,
        data,
      });
      setResumeId(row.id);
      setResumeName(row.name);
      router.replace(`/app?resumeId=${row.id}&template=${templateId}`);
      clearDraft();
      notifyResumeListChanged();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      alert(t("myResumes.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const templateDefinition =
    templates.find((template) => template.id === templateId) ?? templates[0];
  const TemplateComponent = templateDefinition.component;
  const MobileTemplateComponent = templateDefinition.mobileTemplateComponent;

  // The mobile form and desktop canvas are both always mounted (one hidden
  // via a CSS breakpoint, see the two top-level branches below) and tag
  // their top-level field/section blocks with a shared
  // `data-section-anchor` (see components/Sortable.tsx's `SortableBlock`
  // `anchor` prop) — so every step key has two matching elements in the
  // DOM. `offsetParent === null` is a cheap "not display:none" check that
  // picks out whichever one is actually visible right now.
  function scrollToSectionAnchor(anchor: string) {
    const matches = document.querySelectorAll<HTMLElement>(
      `[data-section-anchor="${anchor}"]`,
    );
    for (const element of matches) {
      if (element.offsetParent !== null) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }

  // Whether a step's underlying content is *fully* filled in — every
  // visible personal-info field, or every entry's every field for a
  // section — not just started. Drives the step-primary (purple, matching
  // the Preview button) color. Requires at least one entry to exist too,
  // so an empty section never counts as "complete".
  function isStepFilled(key: string): boolean {
    if (key === "personalInfo") {
      return (
        visibleFields.length > 0 &&
        visibleFields.every((field) => Boolean(data[field]))
      );
    }
    switch (key as SectionKey) {
      case "workExperience":
        return (
          data.workExperience.length > 0 &&
          data.workExperience.every(
            (entry) =>
              entry.position &&
              entry.location &&
              entry.jobDescription &&
              entry.dateFrom &&
              entry.dateTo,
          )
        );
      case "education":
        return (
          data.education.length > 0 &&
          data.education.every(
            (entry) =>
              entry.school &&
              entry.subject &&
              entry.location &&
              entry.description &&
              entry.dateFrom &&
              entry.dateTo,
          )
        );
      case "skills":
        return (
          data.skills.length > 0 && data.skills.every((entry) => entry.value)
        );
      case "certifications":
        return (
          data.certifications.length > 0 &&
          data.certifications.every((entry) => entry.name && entry.dateFrom)
        );
      case "languages":
        return (
          data.languages.length > 0 &&
          data.languages.every((entry) => entry.language)
        );
      case "interests":
        return (
          data.interests.length > 0 &&
          data.interests.every((entry) => entry.value)
        );
      default:
        return false;
    }
  }

  // Field-level completeness for the radial-progress percentage: unlike
  // isStepFilled's all-or-nothing step check, this grades every individual
  // field on every entry, so partially-filled sections contribute partial
  // credit instead of counting as fully incomplete.
  function entryFieldStats<T>(
    entries: T[],
    fields: (keyof T)[],
  ): { filled: number; total: number } {
    if (entries.length === 0) return { filled: 0, total: fields.length };
    let filled = 0;
    for (const entry of entries) {
      for (const field of fields) {
        if (entry[field]) filled++;
      }
    }
    return { filled, total: fields.length * entries.length };
  }

  function fieldCompletionStats(key: string): {
    filled: number;
    total: number;
  } {
    if (key === "personalInfo") {
      return {
        filled: visibleFields.filter((field) => Boolean(data[field])).length,
        total: visibleFields.length,
      };
    }
    switch (key as SectionKey) {
      case "workExperience":
        return entryFieldStats(data.workExperience, [
          "position",
          "location",
          "jobDescription",
          "dateFrom",
          "dateTo",
        ]);
      case "education":
        return entryFieldStats(data.education, [
          "school",
          "subject",
          "location",
          "description",
          "dateFrom",
          "dateTo",
        ]);
      case "skills":
        return entryFieldStats(data.skills, ["value"]);
      case "certifications":
        return entryFieldStats(data.certifications, ["name", "dateFrom", "dateTo"]);
      case "languages":
        return entryFieldStats(data.languages, ["language"]);
      case "interests":
        return entryFieldStats(data.interests, ["value"]);
      default:
        return { filled: 0, total: 0 };
    }
  }

  // One step per resume "part": personal info (name/contact/about me,
  // whenever at least one such field is visible) followed by every
  // currently-visible section in the user's own drag order — hidden
  // sections (removed from `sectionOrder` via the Features toggle) don't
  // get a step, since there's nothing to scroll to.
  function renderSectionSteps() {
    const stepKeys: string[] = [
      ...(visibleFields.length > 0 ? ["personalInfo"] : []),
      ...sectionOrder,
    ];
    if (stepKeys.length === 0) return null;

    const incompleteKeys = stepKeys.filter((key) => !isStepFilled(key));

    const fieldStats = stepKeys.map((key) => fieldCompletionStats(key));
    const totalFields = fieldStats.reduce((sum, s) => sum + s.total, 0);
    const filledFields = fieldStats.reduce((sum, s) => sum + s.filled, 0);
    const sectionCompletionPercent =
      totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    return (
      <div className="flex flex-col gap-4">
        <ul className="steps steps-vertical overflow-visible!">
          {stepKeys.map((key) => (
            <li
              key={key}
              className={`step ${isStepFilled(key) ? "step-primary" : ""}`}
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="cursor-pointer text-left font-medium"
                  onClick={() => scrollToSectionAnchor(key)}
                >
                  {key === "personalInfo"
                    ? t("resumeSteps.personalInfo")
                    : t(`sections.${key}`)}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mx-auto flex items-center gap-2">
          <div
            className="radial-progress text-primary"
            style={
              {
                "--value": sectionCompletionPercent,
                "--size": "4rem",
              } as React.CSSProperties
            }
            role="progressbar"
            aria-valuenow={sectionCompletionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {sectionCompletionPercent}%
          </div>
          <span className="text-base font-medium">
            {t("resumeSteps.completed")}
          </span>

          <div className="tooltip tooltip-primary tooltip-bottom tooltip-end -ml-1 mt-1.5 self-start">
            <div className="tooltip-content">
              <div className="flex flex-col gap-1.5 p-1 text-left text-xs">
                {incompleteKeys.length === 0 ? (
                  <span>{t("resumeSteps.allComplete")}</span>
                ) : (
                  incompleteKeys.map((incompleteKey) => (
                    <p key={incompleteKey}>
                      <span className="font-semibold">
                        {incompleteKey === "personalInfo"
                          ? t("resumeSteps.personalInfo")
                          : t(`sections.${incompleteKey}`)}
                        :
                      </span>{" "}
                      {t(`resumeSteps.${incompleteKey}Tooltip`)}
                    </p>
                  ))
                )}
              </div>
            </div>
            <InfoIcon className="h-4 w-4 shrink-0 stroke-current opacity-60" />
          </div>
        </div>
      </div>
    );
  }

  function renderActionButtons(className: string) {
    return (
      <div className={className}>
        <button
          type="button"
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          onClick={handleNewResume}
        >
          {t("myResumes.newResume")}
        </button>

        <button
          type="button"
          className="btn btn-primary btn-lg flex-1 md:flex-none md:w-48"
          onClick={() => previewRef.current?.open()}
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

        <PrintButton
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          previewRef={previewRef}
        />

        <ExportFormatMenu
          format={exportFormat}
          onChange={setExportFormat}
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
        />

        <EmailButton
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          fileName={resumeName || "resume"}
          format={exportFormat}
          textContent={exportText}
          pdfTemplate={pdfTemplates[templateId]}
          pdfProps={{
            data,
            sectionOrder,
            color,
            font,
            fontSize,
            visibleFields,
            modernSectionZones,
          }}
        />

        <DownloadButton
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          fileName={resumeName || "resume"}
          format={exportFormat}
          textContent={exportText}
          pdfTemplate={pdfTemplates[templateId]}
          pdfProps={{
            data,
            sectionOrder,
            color,
            font,
            fontSize,
            visibleFields,
            modernSectionZones,
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="bg-base-200 flex flex-1 flex-col gap-6 p-4 md:hidden">
        <MobileTemplateComponent
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
          modernSectionZones={modernSectionZones}
          onChangeModernSectionZones={setModernSectionZones}
          color={color}
        />
        <div className="flex flex-col gap-3">
          {renderActionButtons("flex gap-2")}
          {renderSectionSteps()}
        </div>
      </div>

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
            modernSectionZones={modernSectionZones}
            onChangeModernSectionZones={setModernSectionZones}
          />
        </div>

        <div className="order-first flex flex-col gap-3 lg:sticky lg:top-8 lg:order-last lg:self-start">
          {renderActionButtons("flex flex-col gap-2")}
          {renderSectionSteps()}
        </div>
      </div>

      <PreviewModal
        ref={previewRef}
        templateComponent={TemplateComponent}
        templateProps={{
          data,
          sectionOrder,
          color,
          font,
          fontSize,
          visibleFields,
          sectionZones: modernSectionZones,
        }}
      />

      <SaveResumeDialog ref={saveDialogRef} />
      <ConfirmDialog ref={upgradeDialogRef} />
    </>
  );
}
