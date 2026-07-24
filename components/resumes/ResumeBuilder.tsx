"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/nextjs";
import { useAppState } from "@/components/AppState";
import AtsCheckerDialog, { type AtsCheckerDialogHandle } from "@/components/AtsCheckerDialog";
import CompletionSteps from "@/components/CompletionSteps";
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/ConfirmDialog";
import DownloadButton from "@/components/DownloadButton";
import EmailButton from "@/components/EmailButton";
import ExportFormatMenu from "@/components/ExportFormatMenu";
import { SaveIcon } from "@/components/Icons";
import PreviewModal, {
  type PreviewModalHandle,
} from "@/components/PreviewModal";
import PrintButton from "@/components/PrintButton";
import Resume from "@/components/resumes/Resume";
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import { FREE_TIER_LIMITS, SAVED_INDICATOR_DURATION_MS } from "@/lib/constants";
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
import { checkResumeFormat } from "@/lib/atsChecker/checkResumeFormat";
import { pdfTemplates } from "@/lib/pdf/templates";
import { scrollToSectionAnchor } from "@/lib/scrollToSectionAnchor";
import { createClient } from "@/lib/supabase/client";
import { countResumes, getResume, saveResume } from "@/lib/supabase/resumes";
import { ensureUserId } from "@/lib/supabase/session";
import { getSubscription, isPaidPlan } from "@/lib/supabase/subscriptions";
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

const DRAFT_STORAGE_KEY = "resumeBuilder:draft";

function loadDraft(): ResumeData | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    // Drafts saved before a data-model field was added (e.g. customFields)
    // won't have it in their stored JSON — backfill from the current
    // defaults so older drafts don't crash newer template code.
    return { ...emptyResumeData, ...(JSON.parse(raw) as ResumeData) };
  } catch {
    return null;
  }
}

function saveDraft(data: ResumeData) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch {

  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {

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
    setResumeStepsSummary,
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
  const atsCheckerRef = useRef<AtsCheckerDialogHandle>(null);
  const [supabase] = useState(() => createClient());
  const exportText = generateResumeText({ data, sectionOrder, visibleFields });

  async function buildResumeDocxBlob(): Promise<Blob> {
    const [{ generateResumeDocx }, { Packer }] = await Promise.all([
      import("@/lib/docx/resumeDocx"),
      import("docx"),
    ]);
    return Packer.toBlob(generateResumeDocx({ data, sectionOrder, visibleFields }));
  }

  useEffect(() => {
    setTemplateId(resolveTemplateId(initialTemplateId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTemplateId]);

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
      setTimeout(() => setJustSaved(false), SAVED_INDICATOR_DURATION_MS);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      alert(t("myResumes.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyS") {
        event.preventDefault();
        handleSaveRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const templateDefinition =
    templates.find((template) => template.id === templateId) ?? templates[0];
  const TemplateComponent = templateDefinition.component;
  const MobileTemplateComponent = templateDefinition.mobileTemplateComponent;

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
      case "customFields":
        return Boolean(data.customFieldValue);
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
      case "customFields":
        return { filled: data.customFieldValue ? 1 : 0, total: 1 };
      default:
        return { filled: 0, total: 0 };
    }
  }

  // One step per resume "part": personal info (name/contact/about me,
  // whenever at least one such field is visible) followed by every
  // currently-visible section in the user's own drag order — hidden
  // sections (removed from `sectionOrder` via the Features toggle) don't
  // get a step, since there's nothing to scroll to. Recomputed every render
  // (cheap) and both rendered inline below *and* published to
  // `AppState.resumeStepsSummary` (see the effect below) so `Sidebar.tsx`
  // can show the identical checklist under "My Resumes" once the `lg`
  // breakpoint takes over from this inline copy.
  const stepKeys: string[] = [
    ...(visibleFields.length > 0 ? ["personalInfo"] : []),
    ...sectionOrder,
  ];
  const incompleteKeys = stepKeys.filter((key) => !isStepFilled(key));
  const stepFieldStats = stepKeys.map((key) => fieldCompletionStats(key));
  const totalStepFields = stepFieldStats.reduce((sum, s) => sum + s.total, 0);
  const filledStepFields = stepFieldStats.reduce((sum, s) => sum + s.filled, 0);
  const sectionCompletionPercent =
    totalStepFields > 0 ? Math.round((filledStepFields / totalStepFields) * 100) : 0;

  // Publishes the current steps snapshot to shared state so Sidebar.tsx can
  // render it too, and clears it on unmount so the sidebar shows nothing
  // extra once the user navigates away from this editor.
  //
  // Deliberately depends on `data`/`sectionOrder`/`visibleFields` (the
  // actual inputs) rather than `stepKeys`/`incompleteKeys` themselves:
  // those are new array literals every render, so depending on them
  // directly would make the effect's deps look "changed" on the very
  // re-render its own `setResumeStepsSummary` call causes (this component
  // reads other fields from the same AppState context it just wrote to) —
  // an infinite update loop, not just a wasted render (see
  // CoverLetterBuilder.tsx's identical effect for the same reasoning).
  useEffect(() => {
    setResumeStepsSummary(
      stepKeys.length === 0
        ? null
        : {
            stepKeys,
            incompleteKeys,
            completionPercent: sectionCompletionPercent,
            customFieldsTitle: data.customFieldsTitle,
          },
    );
    return () => setResumeStepsSummary(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sectionOrder, visibleFields, setResumeStepsSummary]);

  function renderInlineSteps() {
    // Hidden at `lg`+, where Sidebar.tsx takes over showing this same
    // checklist under "My Resumes" instead.
    return (
      <div className="lg:hidden">
        <CompletionSteps
          stepKeys={stepKeys}
          incompleteKeys={incompleteKeys}
          completionPercent={sectionCompletionPercent}
          titleKey={(key) => (key === "personalInfo" ? "resumeSteps.personalInfo" : `sections.${key}`)}
          titleOverride={(key) => (key === "customFields" ? data.customFieldsTitle || undefined : undefined)}
          tooltipKey={(key) => `resumeSteps.${key}Tooltip`}
          completedLabelKey="resumeSteps.completed"
          allCompleteLabelKey="resumeSteps.allComplete"
          onStepClick={scrollToSectionAnchor}
        />
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
          buildDocxBlob={buildResumeDocxBlob}
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
          buildDocxBlob={buildResumeDocxBlob}
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

        <button
          type="button"
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          onClick={() =>
            atsCheckerRef.current?.open({
              formatChecks: checkResumeFormat(data, templateId),
              documentText: exportText,
            })
          }
        >
          {t("atsChecker.buttonLabel")}
        </button>
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
          {renderInlineSteps()}
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
          {renderInlineSteps()}
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
      <AtsCheckerDialog ref={atsCheckerRef} />
    </>
  );
}
