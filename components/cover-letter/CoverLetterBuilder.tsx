"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/nextjs";
import { useAppState } from "@/components/AppState";
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
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import CoverLetter from "@/components/cover-letter/CoverLetter";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { isCoverLetterFieldFilled } from "@/lib/coverLetterFields";
import {
  coverLetterSectionFieldKeys,
  coverLetterSectionStepTitleKey,
  defaultCoverLetterSectionOrder,
  type CoverLetterSectionKey,
} from "@/lib/coverLetterSections";
import { coverLetterTemplates } from "@/lib/coverLetterTemplates";
import type { ExportFormat } from "@/lib/exportFormat";
import { coverLetterPdfTemplates } from "@/lib/pdf/coverLetterTemplates";
import { scrollToSectionAnchor } from "@/lib/scrollToSectionAnchor";
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
    setCoverLetterStepsSummary,
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

  async function buildCoverLetterDocxBlob(): Promise<Blob> {
    const [{ generateCoverLetterDocx }, { Packer }] = await Promise.all([
      import("@/lib/docx/coverLetterDocx"),
      import("docx"),
    ]);
    return Packer.toBlob(
      generateCoverLetterDocx({
        data,
        sectionOrder,
        visibleFields: coverLetterFieldOrder,
      }),
    );
  }

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

  const stepKeys = sectionOrder.filter((key) => fieldCompletionStats(key).total > 0);
  const incompleteKeys = stepKeys.filter((key) => !isStepFilled(key));
  const stepStats = stepKeys.map((key) => fieldCompletionStats(key));
  const totalStepFields = stepStats.reduce((sum, s) => sum + s.total, 0);
  const filledStepFields = stepStats.reduce((sum, s) => sum + s.filled, 0);
  const completionPercent =
    totalStepFields > 0 ? Math.round((filledStepFields / totalStepFields) * 100) : 0;

  useEffect(() => {
    setCoverLetterStepsSummary(
      stepKeys.length === 0 ? null : { stepKeys, incompleteKeys, completionPercent },
    );
    return () => setCoverLetterStepsSummary(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sectionOrder, coverLetterFieldOrder, setCoverLetterStepsSummary]);

  function renderInlineSteps() {

    return (
      <div className="lg:hidden">
        <CompletionSteps
          stepKeys={stepKeys}
          incompleteKeys={incompleteKeys}
          completionPercent={completionPercent}
          titleKey={(key) => coverLetterSectionStepTitleKey[key as CoverLetterSectionKey]}
          tooltipKey={(key) => `coverLetterSteps.${key}Tooltip`}
          completedLabelKey="coverLetterSteps.completed"
          allCompleteLabelKey="coverLetterSteps.allComplete"
          onStepClick={scrollToSectionAnchor}
        />
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
          buildDocxBlob={buildCoverLetterDocxBlob}
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
          buildDocxBlob={buildCoverLetterDocxBlob}
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
          {renderInlineSteps()}
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
          {renderInlineSteps()}
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
