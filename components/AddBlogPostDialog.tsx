"use client";

/**
 * Admin-only "Add Blog" form, opened from components/BlogPageContent.tsx.
 * Same imperative-ref/Promise pattern as components/SaveResumeDialog.tsx,
 * but `open()` takes no args and resolves `true` once a post was actually
 * created (so the caller knows to `router.refresh()`), or `false` if
 * cancelled.
 */
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import { blogCategories, type BlogCategoryKey } from "@/lib/supabase/blogPosts";

export interface AddBlogPostDialogHandle {
  open: () => Promise<boolean>;
}

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  content: "",
  category: "resumeTips" as BlogCategoryKey,
  publishedAt: "",
  authorName: "",
  authorAvatarUrl: "",
  readTime: "",
};

export default function AddBlogPostDialog({ ref }: { ref?: Ref<AddBlogPostDialogHandle> }) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolveRef = useRef<((created: boolean) => void) | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    open() {
      setForm({ ...EMPTY_FORM, publishedAt: Temporal.Now.plainDateISO().toString() });
      setError(null);
      dialogRef.current?.showModal();
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  function close(result: boolean) {
    dialogRef.current?.close();
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          authorAvatarUrl: form.authorAvatarUrl.trim() || null,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? t("blog.dialog.submitError"));
        return;
      }
      close(true);
    } catch {
      setError(t("blog.dialog.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-bold">{t("blog.dialog.title")}</h3>
        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset mt-4">
            <label className="label" htmlFor="blog-title">
              {t("blog.dialog.titleLabel")}
            </label>
            <input
              id="blog-title"
              type="text"
              required
              className="input input-bordered w-full"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />

            <label className="label mt-3" htmlFor="blog-subtitle">
              {t("blog.dialog.subtitleLabel")}
            </label>
            <input
              id="blog-subtitle"
              type="text"
              required
              className="input input-bordered w-full"
              value={form.subtitle}
              onChange={(event) => update("subtitle", event.target.value)}
            />

            <label className="label mt-3" htmlFor="blog-content">
              {t("blog.dialog.contentLabel")}
            </label>
            <textarea
              id="blog-content"
              required
              rows={8}
              className="textarea textarea-bordered w-full"
              value={form.content}
              onChange={(event) => update("content", event.target.value)}
            />
            <p className="text-base-content/60 mt-1 text-xs">{t("blog.dialog.contentHint")}</p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="blog-category">
                  {t("blog.dialog.categoryLabel")}
                </label>
                <select
                  id="blog-category"
                  className="select select-bordered w-full"
                  value={form.category}
                  onChange={(event) => update("category", event.target.value as BlogCategoryKey)}
                >
                  {blogCategories.map((category) => (
                    <option key={category} value={category}>
                      {t(`blog.categories.${category}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="blog-date">
                  {t("blog.dialog.dateLabel")}
                </label>
                <input
                  id="blog-date"
                  type="date"
                  required
                  className="input input-bordered w-full"
                  value={form.publishedAt}
                  onChange={(event) => update("publishedAt", event.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="blog-author-name">
                  {t("blog.dialog.authorNameLabel")}
                </label>
                <input
                  id="blog-author-name"
                  type="text"
                  required
                  className="input input-bordered w-full"
                  value={form.authorName}
                  onChange={(event) => update("authorName", event.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="blog-read-time">
                  {t("blog.dialog.readTimeLabel")}
                </label>
                <input
                  id="blog-read-time"
                  type="text"
                  required
                  placeholder={t("blog.dialog.readTimePlaceholder")}
                  className="input input-bordered w-full"
                  value={form.readTime}
                  onChange={(event) => update("readTime", event.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label" htmlFor="blog-avatar-url">
                  {t("blog.dialog.authorAvatarUrlLabel")}
                </label>
                <input
                  id="blog-avatar-url"
                  type="url"
                  className="input input-bordered w-full"
                  value={form.authorAvatarUrl}
                  onChange={(event) => update("authorAvatarUrl", event.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-error mt-3 text-sm">{error}</p>}
          </fieldset>

          <div className="modal-action">
            <button type="button" className="btn" onClick={() => close(false)}>
              {t("buttons.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="loading loading-spinner loading-xs" /> : t("blog.dialog.publish")}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => close(false)}>close</button>
      </form>
    </dialog>
  );
}
