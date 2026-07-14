"use client";

/**
 * Top-level cover letter builder page component rendered by the
 * `/cover-letter` route: owns the cover letter's data state, loads a saved
 * one by id, and renders the editable form alongside Preview/Save/Print/
 * Download actions plus a completion-steps panel, mirroring `Home.tsx`'s
 * resume flow (`renderSectionSteps`) but simpler — one fixed template, and
 * a single, non-repeatable field per section instead of arbitrary-length
 * entries, so each step is either fully filled or not (no partial-entry
 * grading needed beyond simple field counts).
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import { InfoIcon, SaveIcon } from "@/components/Icons";
import PrintButton from "@/components/PrintButton";
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import CoverLetterDownloadButton from "@/components/cover-letter/CoverLetterDownloadButton";
import CoverLetterEditor from "@/components/cover-letter/CoverLetterEditor";
import CoverLetterPreviewModal, {
  type PreviewModalHandle,
} from "@/components/cover-letter/CoverLetterPreviewModal";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { isCoverLetterFieldFilled } from "@/lib/coverLetterFields";
import {
  coverLetterSectionFieldKeys,
  defaultCoverLetterSectionOrder,
  type CoverLetterSectionKey,
} from "@/lib/coverLetterSections";
import { createClient } from "@/lib/supabase/client";
import { getCoverLetter, saveCoverLetter } from "@/lib/supabase/coverLetters";
import { ensureUserId } from "@/lib/supabase/session";

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
    notifyCoverLetterListChanged,
  } = useAppState();
  const [data, setData] = useState<CoverLetterData>(emptyCoverLetterData);
  const [sectionOrder, setSectionOrder] = useState<CoverLetterSectionKey[]>(
    defaultCoverLetterSectionOrder,
  );
  const [coverLetterId, setCoverLetterId] = useState<string | null>(
    initialCoverLetterId ?? null,
  );
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const previewRef = useRef<PreviewModalHandle>(null);
  const saveDialogRef = useRef<SaveResumeDialogHandle>(null);
  const [supabase] = useState(() => createClient());

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

  // Each section's own SortableBlock (in CoverLetterEditor.tsx) is tagged
  // with `data-section-anchor` via its `anchor` prop — same mechanism as
  // Home.tsx's resume steps, just without the mobile/desktop dual-tree
  // lookup since this page renders a single tree.
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

  async function handleSave() {
    if (isSaving) return;

    let nameToSave = name;
    if (!nameToSave) {
      const chosenName = await saveDialogRef.current?.open(name);
      if (!chosenName) return;
      nameToSave = chosenName;
    }

    setIsSaving(true);
    try {
      const userId = await ensureUserId(supabase);
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
      alert(t("coverLetter.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-base-200 flex flex-1 flex-col gap-6 p-4 lg:flex-row lg:items-start lg:justify-center lg:p-8">
        <div className="w-full min-w-0 overflow-x-auto lg:w-auto">
          <CoverLetterEditor
            data={data}
            onChange={handleChange}
            fieldOrder={coverLetterFieldOrder}
            onReorderFields={setCoverLetterFieldOrder}
            sectionOrder={sectionOrder}
            onReorderSections={setSectionOrder}
            color={color}
            font={font}
            fontSize={fontSize}
          />
        </div>

        <div className="flex flex-col gap-2 lg:sticky lg:top-8 lg:w-48">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => previewRef.current?.open()}
          >
            {t("buttons.preview")}
          </button>

          <button
            type="button"
            className="btn btn-outline hover:border-primary"
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
            className="btn btn-outline hover:border-primary"
            previewRef={previewRef}
          />

          <CoverLetterDownloadButton
            className="btn btn-outline hover:border-primary"
            fileName={name}
            data={data}
            color={color}
            font={font}
            fontSize={fontSize}
            visibleFields={coverLetterFieldOrder}
          />

          {renderCoverLetterSteps()}
        </div>

        <CoverLetterPreviewModal
          ref={previewRef}
          data={data}
          color={color}
          font={font}
          fontSize={fontSize}
          visibleFields={coverLetterFieldOrder}
        />
        <SaveResumeDialog
          ref={saveDialogRef}
          title={t("coverLetter.nameDialogTitle")}
          placeholder={t("coverLetter.namePlaceholder")}
          untitledFallback={t("coverLetter.untitled")}
          tooLongMessage={t("coverLetter.nameTooLong")}
        />
      </div>
    </div>
  );
}
