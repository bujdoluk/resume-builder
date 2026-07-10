"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmDialog, {
  type ConfirmDialogHandle,
} from "@/components/ConfirmDialog";
import { deleteResume, listResumes, type ResumeRow } from "@/lib/supabase/resumes";
import { createClient } from "@/lib/supabase/client";
import { ensureUserId } from "@/lib/supabase/session";

export default function MyResumesPage() {
  const { t } = useTranslation();
  const [supabase] = useState(() => createClient());
  const [resumes, setResumes] = useState<ResumeRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null);

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
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-base-200 flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold">{t("myResumes.pageTitle")}</h1>

        {loadFailed && (
          <p className="text-error">{t("myResumes.loadFailed")}</p>
        )}

        {!loadFailed && resumes && resumes.length === 0 && (
          <p className="text-gray-500">{t("myResumes.empty")}</p>
        )}

        {!loadFailed && resumes && resumes.length > 0 && (
          <div className="bg-base-100 border-base-300 overflow-x-auto rounded-lg border">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("myResumes.name")}</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name || t("myResumes.untitled")}</td>
                    <td className="w-px">
                      <Link
                        href={`/app?resumeId=${row.id}&template=${row.templateId}`}
                        className="btn btn-outline btn-sm"
                      >
                        {t("myResumes.edit")}
                      </Link>
                    </td>
                    <td className="w-px">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-error"
                        onClick={() => handleDelete(row.id)}
                      >
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
    </div>
  );
}
