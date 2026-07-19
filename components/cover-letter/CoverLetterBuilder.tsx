"use client";

/**
 * Top-level cover letter builder page component rendered by the
 * `/cover-letter` route: owns the cover letter's data state, loads a saved
 * one by id, and renders either the mobile editing form or the desktop
 * editing canvas (mirroring `ResumeBuilder.tsx`'s mobile/desktop split between
 * `MobileTemplateComponent` and `Resume.tsx`) alongside Preview/Save/Print/
 * Download actions plus a completion-steps panel
 * (`renderCoverLetterSteps`, mirroring `ResumeBuilder.tsx`'s `renderSectionSteps`
 * but simpler — one fixed template, and a single, non-repeatable field per
 * section instead of arbitrary-length entries, so each step is either
 * fully filled or not).
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
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import CoverLetter from "@/components/cover-letter/CoverLetter";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { isCoverLetterFieldFilled } from "@/lib/coverLetterFields";
import {
  coverLetterSectionFieldKeys,
  defaultCoverLetterSectionOrder,
  type CoverLetterSectionKey,
} from "@/lib/coverLetterSections";
import { coverLetterTemplates } from "@/lib/coverLetterTemplates";
import type { ExportFormat } from "@/lib/exportFormat";
import { coverLetterPdfTemplates } from "@/lib/pdf/coverLetterTemplates";
import { createClient } from "@/lib/supabase/client";
import { countCoverLetters, getCoverLetter, saveCoverLetter } from "@/lib/supabase/coverLetters";
import { ensureUserId } from "@/lib/supabase/session";
import { FREE_TIER_LIMITS, getSubscription, isPaidPlan } from "@/lib/supabase/subscriptions";
import { generateCoverLetterText } from "@/lib/text/coverLetterText";

interface CoverLetterBuilderProps {
  initialCoverLetterId?: string;
}

export default function CoverLetterBuilder({
  initialCoverLetterId,
}: CoverLetterBuilderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    color,
    font,
    fontSize,
    coverLetterFieldOrder,
    setCoverLetterFieldOrder,
    coverLetterTemplateId,
    coverLetterSectionZones,
    setCoverLetterSectionZones,
    notifyCoverLetterListChanged,
  } = useAppState();
  const [data, setData] = useState<CoverLetterData>(emptyCoverLetterData);
  const [sectionOrder, setSectionOrder] = useState<CoverLetterSectionKey[]>(
    defaultCoverLetterSectionOrder,
  );
  const templateDefinition =
    coverLetterTemplates.find((template) => template.id === coverLetterTemplateId) ??
    coverLetterTemplates[0];
  const TemplateComponent = templateDefinition.component;
  const MobileTemplateComponent = templateDefinition.mobileTemplateComponent;
  const PdfTemplate = coverLetterPdfTemplates[coverLetterTemplateId];
  const [coverLetterId, setCoverLetterId] = useState<string | null>(
    initialCoverLetterId ?? null,
  );
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const previewRef = useRef<PreviewModalHandle>(null);
  const saveDialogRef = useRef<SaveResumeDialogHandle>(null);
  const upgradeDialogRef = useRef<ConfirmDialogHandle>(null);
  const [supabase] = useState(() => createClient());
  const exportText = generateCoverLetterText({
    data,
    sectionOrder,
    visibleFields: coverLetterFieldOrder,
  });

  useEffect(() => {
    if (!initialCoverLetterId) return;
    let cancelled = false;

    getCoverLetter(supabase, initialCoverLetterId).then((row) => {
      if (!row || cancelled) return;
      setData(row.data);
      setName(row.name);
    });

    return () => {
      cancelled = true;
    };
  }, [initialCoverLetterId, supabase]);

  function handleChange(field: keyof CoverLetterData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  // Each section's own SortableBlock (in CoverLetterFormFields.tsx) is
  // tagged with `data-section-anchor` via its `anchor` prop — same
  // mechanism as ResumeBuilder.tsx's resume steps, just without the
  // mobile/desktop dual-tree lookup since this page renders a single tree.
  function scrollToSectionAnchor(anchor: string) {
    document
      .querySelector<HTMLElement>(`[data-section-anchor="${anchor}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // {filled, total} counts only the section's fields that are currently
  // visible (present in `coverLetterFieldOrder`) — a field hidden via the
  // Navbar's Features control doesn't count toward either number.
  function fieldCompletionStats(key: CoverLetterSectionKey): {
    filled: number;
    total: number;
  } {
    const visibleSectionFields = coverLetterSectionFieldKeys[key].filter((field) =>
      coverLetterFieldOrder.includes(field),
    );
    return {
      filled: visibleSectionFields.filter((field) =>
        isCoverLetterFieldFilled(field, data),
      ).length,
      total: visibleSectionFields.length,
    };
  }

  function isStepFilled(key: CoverLetterSectionKey): boolean {
    const stats = fieldCompletionStats(key);
    return stats.total > 0 && stats.filled === stats.total;
  }

  const sectionStepTitleKey: Record<CoverLetterSectionKey, string> = {
    sender: "coverLetter.sectionSender",
    recipient: "coverLetter.sectionRecipient",
    date: "coverLetter.sectionDate",
    subject: "coverLetter.sectionSubject",
    letter: "coverLetter.sectionLetter",
  };

  function renderCoverLetterSteps() {
    // A section with none of its own fields currently visible has nothing
    // to fill in or scroll to, so it doesn't get a step — mirrors how it
    // also collapses entirely out of the editor itself.
    const stepKeys = sectionOrder.filter(
      (key) => fieldCompletionStats(key).total > 0,
    );
    if (stepKeys.length === 0) return null;

    const incompleteKeys = stepKeys.filter((key) => !isStepFilled(key));

    const stats = stepKeys.map((key) => fieldCompletionStats(key));
    const totalFields = stats.reduce((sum, s) => sum + s.total, 0);
    const filledFields = stats.reduce((sum, s) => sum + s.filled, 0);
    const completionPercent =
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
                  {t(sectionStepTitleKey[key])}
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
                "--value": completionPercent,
                "--size": "4rem",
              } as React.CSSProperties
            }
            role="progressbar"
            aria-valuenow={completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {completionPercent}%
          </div>
          <span className="text-base font-medium">
            {t("coverLetterSteps.completed")}
          </span>

          <div className="tooltip tooltip-primary tooltip-bottom tooltip-end -ml-1 mt-1.5 self-start">
            <div className="tooltip-content">
              <div className="flex flex-col gap-1.5 p-1 text-left text-xs">
                {incompleteKeys.length === 0 ? (
                  <span>{t("coverLetterSteps.allComplete")}</span>
                ) : (
                  incompleteKeys.map((incompleteKey) => (
                    <p key={incompleteKey}>
                      <span className="font-semibold">
                        {t(sectionStepTitleKey[incompleteKey])}:
                      </span>{" "}
                      {t(`coverLetterSteps.${incompleteKey}Tooltip`)}
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

  async function handleNewCoverLetter() {
    const userId = await ensureUserId(supabase);
    const [subscription, existingCount] = await Promise.all([
      getSubscription(supabase, userId),
      countCoverLetters(supabase, userId),
    ]);
    if (!isPaidPlan(subscription.plan) && existingCount >= FREE_TIER_LIMITS.coverLetters) {
      const viewPlans = await upgradeDialogRef.current?.open({
        message: t("pricing.coverLetterLimitReached", { limit: FREE_TIER_LIMITS.coverLetters }),
        confirmLabel: t("pricing.viewPlans"),
      });
      if (viewPlans) router.push("/#pricing");
      return;
    }

    setData(emptyCoverLetterData);
    setSectionOrder(defaultCoverLetterSectionOrder);
    setCoverLetterId(null);
    setName("");
    router.replace("/cover-letter");
  }

  async function handleSave() {
    if (isSaving) return;

    let nameToSave = name;
    if (!nameToSave) {
      const chosenName = await saveDialogRef.current?.open(name);
      if (!chosenName) return;
      nameToSave = chosenName;
    }

    try {
      const userId = await ensureUserId(supabase);

      if (!coverLetterId) {
        const [subscription, existingCount] = await Promise.all([
          getSubscription(supabase, userId),
          countCoverLetters(supabase, userId),
        ]);
        if (!isPaidPlan(subscription.plan) && existingCount >= FREE_TIER_LIMITS.coverLetters) {
          const viewPlans = await upgradeDialogRef.current?.open({
            message: t("pricing.coverLetterLimitReached", { limit: FREE_TIER_LIMITS.coverLetters }),
            confirmLabel: t("pricing.viewPlans"),
          });
          if (viewPlans) router.push("/#pricing");
          return;
        }
      }

      setIsSaving(true);
      const row = await saveCoverLetter(supabase, {
        id: coverLetterId,
        userId,
        name: nameToSave,
        data,
      });
      setCoverLetterId(row.id);
      setName(row.name);
      router.replace(`/cover-letter?id=${row.id}`);
      notifyCoverLetterListChanged();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      alert(t("coverLetter.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  function renderActionButtons(className: string) {
    return (
      <div className={className}>
        <button
          type="button"
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          onClick={handleNewCoverLetter}
        >
          {t("myCoverLetters.newCoverLetter")}
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
          fileName={name || "cover-letter"}
          format={exportFormat}
          textContent={exportText}
          pdfTemplate={PdfTemplate}
          pdfProps={{
            data,
            color,
            font,
            fontSize,
            visibleFields: coverLetterFieldOrder,
            sectionOrder,
            sectionZones: coverLetterSectionZones,
          }}
        />

        <DownloadButton
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          fileName={name || "cover-letter"}
          format={exportFormat}
          textContent={exportText}
          pdfTemplate={PdfTemplate}
          pdfProps={{
            data,
            color,
            font,
            fontSize,
            visibleFields: coverLetterFieldOrder,
            sectionOrder,
            sectionZones: coverLetterSectionZones,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-base-200 flex flex-1 flex-col gap-6 p-4 md:hidden">
        <MobileTemplateComponent
          data={data}
          onChange={handleChange}
          fieldOrder={coverLetterFieldOrder}
          onReorderFields={setCoverLetterFieldOrder}
          sectionOrder={sectionOrder}
          onReorderSections={setSectionOrder}
          color={color}
          font={font}
          fontSize={fontSize}
          sectionZones={coverLetterSectionZones}
          onChangeSectionZones={setCoverLetterSectionZones}
        />
        <div className="flex flex-col gap-3">
          {renderActionButtons("flex gap-2")}
          {renderCoverLetterSteps()}
        </div>
      </div>

      <div className="bg-base-200 hidden flex-1 flex-col items-center gap-6 p-4 md:flex lg:flex-row lg:items-start lg:justify-center lg:gap-8 lg:p-8">
        <div className="w-full min-w-0 overflow-x-auto lg:w-auto">
          <CoverLetter
            data={data}
            onChange={handleChange}
            fieldOrder={coverLetterFieldOrder}
            onReorderFields={setCoverLetterFieldOrder}
            sectionOrder={sectionOrder}
            onReorderSections={setSectionOrder}
            color={color}
            font={font}
            fontSize={fontSize}
            templateId={coverLetterTemplateId}
            sectionZones={coverLetterSectionZones}
            onChangeSectionZones={setCoverLetterSectionZones}
          />
        </div>

        <div className="order-first flex flex-col gap-3 lg:sticky lg:top-8 lg:order-last lg:self-start">
          {renderActionButtons("flex flex-col gap-2")}
          {renderCoverLetterSteps()}
        </div>
      </div>

      <PreviewModal
        ref={previewRef}
        templateComponent={TemplateComponent}
        templateProps={{
          data,
          color,
          font,
          fontSize,
          visibleFields: coverLetterFieldOrder,
          sectionOrder,
          sectionZones: coverLetterSectionZones,
        }}
      />
      <SaveResumeDialog
        ref={saveDialogRef}
        title={t("coverLetter.nameDialogTitle")}
        placeholder={t("coverLetter.namePlaceholder")}
        untitledFallback={t("coverLetter.untitled")}
        tooLongMessage={t("coverLetter.nameTooLong")}
      />
      <ConfirmDialog ref={upgradeDialogRef} />
    </div>
  );
}
