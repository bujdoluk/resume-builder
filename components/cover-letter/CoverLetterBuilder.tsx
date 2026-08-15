"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/nextjs";
import { useAppState } from "@/components/AppState";
import AtsCheckerDialog, { type AtsCheckerDialogHandle } from "@/components/ai-tools/AtsCheckerDialog";
import CompletionSteps from "@/components/sidebar/CompletionSteps";
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/ConfirmDialog";
import DownloadButton from "@/components/exports/DownloadButton";
import EmailButton from "@/components/exports/EmailButton";
import ExportFormatMenu from "@/components/exports/ExportFormatMenu";
import { SaveIcon, ShareIcon } from "@/components/Icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import PreviewModal, {
  type PreviewModalHandle,
} from "@/components/preview/PreviewModal";
import PrintButton from "@/components/exports/PrintButton";
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import ShareDialog, { type ShareDialogHandle } from "@/components/share/ShareDialog";
import CoverLetter from "@/components/cover-letter/CoverLetter";
import ImportCoverLetterDialog, {
  type ImportCoverLetterDialogHandle,
} from "@/components/cover-letter/ImportCoverLetterDialog";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { isCoverLetterFieldFilled } from "@/lib/coverLetterFields";
import {
  coverLetterSectionFieldKeys,
  coverLetterSectionStepTitleKey,
  defaultCoverLetterSectionOrder,
  type CoverLetterSectionKey,
} from "@/lib/coverLetterSections";
import { getCoverLetterTemplate } from "@/lib/coverLetterTemplates";
import { checkCoverLetterFormat } from "@/lib/atsChecker/checkCoverLetterFormat";
import { FREE_TIER_LIMITS, SAVED_INDICATOR_DURATION_MS } from "@/lib/constants";
import type { ExportFormat } from "@/lib/exportFormat";
import { coverLetterPdfTemplates } from "@/lib/pdf/coverLetterTemplates";
import { scrollToSectionAnchor } from "@/lib/scrollToSectionAnchor";
import { isShareLinkActive } from "@/lib/shareLink";
import { createClient } from "@/lib/supabase/client";
import { countCoverLetters, getCoverLetter, saveCoverLetter } from "@/lib/supabase/coverLetters";
import { ensureUserId } from "@/lib/supabase/session";
import { getSubscription, isPaidPlan } from "@/lib/supabase/subscriptions";
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
  const templateDefinition = getCoverLetterTemplate(coverLetterTemplateId);
  const TemplateComponent = templateDefinition.component;
  const MobileTemplateComponent = templateDefinition.mobileTemplateComponent;
  const PdfTemplate = coverLetterPdfTemplates[coverLetterTemplateId];
  const [coverLetterId, setCoverLetterId] = useState<string | null>(
    initialCoverLetterId ?? null,
  );
  const [loadedCoverLetterId, setLoadedCoverLetterId] = useState<string | null>(null);
  const isLoadingInitialCoverLetter =
    !!initialCoverLetterId && loadedCoverLetterId !== initialCoverLetterId;
  const [name, setName] = useState<string>("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareTokenExpiresAt, setShareTokenExpiresAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const previewRef = useRef<PreviewModalHandle>(null);
  const saveDialogRef = useRef<SaveResumeDialogHandle>(null);
  const upgradeDialogRef = useRef<ConfirmDialogHandle>(null);
  const atsCheckerRef = useRef<AtsCheckerDialogHandle>(null);
  const shareDialogRef = useRef<ShareDialogHandle>(null);
  const importDialogRef = useRef<ImportCoverLetterDialogHandle>(null);
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
      if (cancelled) return;
      if (row) {
        setData(row.data);
        setName(row.name);
        setShareToken(isShareLinkActive(row.shareTokenExpiresAt) ? row.shareToken : null);
        setShareTokenExpiresAt(isShareLinkActive(row.shareTokenExpiresAt) ? row.shareTokenExpiresAt : null);
      }
      setLoadedCoverLetterId(initialCoverLetterId);
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
    if (key === "customFields") {
      return { filled: data.customFieldValue ? 1 : 0, total: 1 };
    }
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
      stepKeys.length === 0
        ? null
        : { stepKeys, incompleteKeys, completionPercent, customFieldsTitle: data.customFieldsTitle },
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
          titleOverride={(key) =>
            key === "customFields" ? data.customFieldsTitle || undefined : undefined
          }
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
    setShareToken(null);
    setShareTokenExpiresAt(null);
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
      setShareToken(isShareLinkActive(row.shareTokenExpiresAt) ? row.shareToken : null);
      setShareTokenExpiresAt(isShareLinkActive(row.shareTokenExpiresAt) ? row.shareTokenExpiresAt : null);
      router.replace(`/cover-letter?id=${row.id}`);
      notifyCoverLetterListChanged();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), SAVED_INDICATOR_DURATION_MS);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      alert(t("coverLetter.saveFailed"));
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
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          onClick={async () => {
            const imported = await importDialogRef.current?.open();
            if (imported) setData(imported);
          }}
        >
          {t("importCoverLetter.buttonLabel")}
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

        <button
          type="button"
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          disabled={!coverLetterId}
          title={!coverLetterId ? t("share.saveFirst") : undefined}
          onClick={() =>
            coverLetterId &&
            shareDialogRef.current?.open({
              kind: "coverLetter",
              id: coverLetterId,
              shareToken,
              shareTokenExpiresAt,
            })
          }
        >
          <ShareIcon className="h-5 w-5 stroke-current" />
          {t("buttons.share")}
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

        <button
          type="button"
          className="btn btn-outline hover:border-primary flex-1 md:flex-none md:w-48"
          onClick={() =>
            atsCheckerRef.current?.open({
              formatChecks: checkCoverLetterFormat(data, coverLetterTemplateId),
              documentText: exportText,
            })
          }
        >
          {t("atsChecker.buttonLabel")}
        </button>
      </div>
    );
  }

  if (isLoadingInitialCoverLetter) {
    return <LoadingSpinner />;
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
      <AtsCheckerDialog ref={atsCheckerRef} />
      <ImportCoverLetterDialog ref={importDialogRef} />
      <ShareDialog
        ref={shareDialogRef}
        onTokenChange={(token, expiresAt) => {
          setShareToken(token);
          setShareTokenExpiresAt(expiresAt);
        }}
      />
    </div>
  );
}
