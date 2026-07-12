"use client";

/**
 * `/my-resumes` route: lists every resume the current (anonymous) user has
 * saved in Supabase, with actions to rename, duplicate, edit, or delete each
 * one.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/components/AppState";
import ConfirmDialog, {
  type ConfirmDialogHandle,
} from "@/components/ConfirmDialog";
import {
  DuplicateIcon,
  PencilIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@/components/Icons";
import SaveResumeDialog, {
  type SaveResumeDialogHandle,
} from "@/components/SaveResumeDialog";
import {
  deleteResume,
  duplicateResume,
  listResumes,
  renameResume,
  type ResumeRow,
} from "@/lib/supabase/resumes";
import { createClient } from "@/lib/supabase/client";
import { ensureUserId } from "@/lib/supabase/session";

export default function MyResumesPage() {
  const { t } = useTranslation();
  const { notifyResumeListChanged } = useAppState();
  const [supabase] = useState(() => createClient());
  const [resumes, setResumes] = useState<ResumeRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null);
  const renameDialogRef = useRef<SaveResumeDialogHandle>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId = await ensureUserId(supabase);
        const rows = await listResumes(supabase, userId);
        if (!cancelled) setResumes(rows);
      } catch (error) {
        console.error(error);
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleDelete(id: string) {
    const confirmed = await confirmDialogRef.current?.open({
      message: t("myResumes.confirmDelete"),
      confirmLabel: t("myResumes.delete"),
    });
    if (!confirmed) return;
    await deleteResume(supabase, id);
    setResumes((prev) => prev?.filter((row) => row.id !== id) ?? null);
    notifyResumeListChanged();
  }

  async function handleRename(row: ResumeRow) {
    const newName = await renameDialogRef.current?.open(row.name);
    if (!newName) return;
    await renameResume(supabase, row.id, newName);
    setResumes(
      (prev) =>
        prev?.map((entry) =>
          entry.id === row.id ? { ...entry, name: newName } : entry,
        ) ?? null,
    );
  }

  async function handleDuplicate(id: string) {
    if (duplicatingId) return;
    setDuplicatingId(id);
    try {
      const userId = await ensureUserId(supabase);
      const copy = await duplicateResume(supabase, id, userId);
      setResumes((prev) => (prev ? [copy, ...prev] : [copy]));
      notifyResumeListChanged();
    } catch (error) {
      console.error(error);
      alert(t("myResumes.duplicateFailed"));
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-base-200 flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold">{t("myResumes.pageTitle")}</h1>

        {loadFailed && (
          <p className="text-error">{t("myResumes.loadFailed")}</p>
        )}

        {!loadFailed && resumes && resumes.length === 0 && (
          <p className="text-base-content/60">{t("myResumes.empty")}</p>
        )}

        {!loadFailed && resumes && resumes.length > 0 && (
          <div className="bg-base-100 border-base-300 overflow-x-auto rounded-lg border">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("myResumes.name")}</th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name || t("myResumes.untitled")}</td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRename(row)}
                      >
                        <PencilIcon className="h-4 w-4 stroke-current" />
                        {t("myResumes.rename")}
                      </button>
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={duplicatingId === row.id}
                        onClick={() => handleDuplicate(row.id)}
                      >
                        {duplicatingId === row.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <DuplicateIcon className="h-4 w-4 stroke-current" />
                        )}
                        {t("myResumes.duplicate")}
                      </button>
                    </td>
                    <td className="w-px">
                      <Link
                        href={`/app?resumeId=${row.id}&template=${row.templateId}`}
                        className="btn btn-outline btn-sm"
                      >
                        <PencilSquareIcon className="h-4 w-4 stroke-current" />
                        {t("myResumes.edit")}
                      </Link>
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-error"
                        onClick={() => handleDelete(row.id)}
                      >
                        <TrashIcon className="h-4 w-4 stroke-current" />
                        {t("myResumes.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog ref={confirmDialogRef} />
      <SaveResumeDialog ref={renameDialogRef} />
    </div>
  );
}
