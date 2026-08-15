"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import { ArrowLeftIcon, PencilIcon, TrashIcon } from "@/components/Icons";
import ConfirmDialog, { type ConfirmDialogHandle } from "@/components/ConfirmDialog";
import BlogPostFormDialog, { type BlogPostFormDialogHandle } from "@/components/blog/BlogPostFormDialog";
import { useToast } from "@/components/Toast";
import { useIsAdmin } from "@/components/useIsAdmin";
import { requestDeleteBlogPost } from "@/lib/api/blog";
import { handleApiResponse } from "@/lib/apiResponse";
import { categoryBadgeClass } from "@/lib/supabase/blogPosts";
import type { BlogPost } from "@/types/blog";

export default function BlogPostContent({ post }: { post: BlogPost }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const isAdmin = useIsAdmin();
  const [deleting, setDeleting] = useState<boolean>(false);
  const confirmDialogRef = useRef<ConfirmDialogHandle>(null);
  const editDialogRef = useRef<BlogPostFormDialogHandle>(null);
  const formattedDate = Temporal.PlainDate.from(post.publishedAt).toLocaleString(i18n.language, {
    dateStyle: "long",
  });
  const paragraphs = post.content.split(/\n\s*\n/);

  async function handleEdit() {
    const saved = await editDialogRef.current?.open(post);
    if (saved) router.refresh();
  }

  async function handleDelete() {
    const confirmed = await confirmDialogRef.current?.open({
      message: t("blog.confirmDelete"),
      confirmLabel: t("blog.delete"),
    });
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await requestDeleteBlogPost(post.id, i18n.language);
      const body = await handleApiResponse(response, showToast, t);
      if (!body) return;
      router.push("/blog");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex-1">
      <div className="bg-base-200 border-base-300 border-b px-8 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/blog"
              className="link link-hover text-base-content/60 flex w-fit items-center gap-1 text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4 stroke-current" />
              {t("blog.backToBlog")}
            </Link>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-outline btn-sm" onClick={handleEdit}>
                  <PencilIcon className="h-4 w-4 stroke-current" />
                  {t("blog.edit")}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-error"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <TrashIcon className="h-4 w-4 stroke-current" />
                  )}
                  {t("blog.delete")}
                </button>
              </div>
            )}
          </div>

          <span className={`badge ${categoryBadgeClass[post.category]}`}>
            {t(`blog.categories.${post.category}`)}
          </span>

          <h1 className="mt-4 font-serif text-3xl leading-tight font-bold sm:text-4xl">{post.title}</h1>

          <p className="text-base-content/70 mt-4 text-lg">{post.subtitle}</p>

          <div className="mt-6 flex items-center gap-3">
            {post.authorAvatarUrl ? (
              <div className="avatar">
                <div className="w-9 rounded-full">
                  <Image
                    src={post.authorAvatarUrl}
                    alt={post.authorName}
                    width={36}
                    height={36}
                    unoptimized
                  />
                </div>
              </div>
            ) : (
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content w-9 rounded-full">
                  <span className="text-sm">{post.authorName.charAt(0)}</span>
                </div>
              </div>
            )}
            <div className="text-sm">
              <p className="font-medium">{post.authorName}</p>
              <p className="text-base-content/60">
                {formattedDate} · {post.readTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-2xl px-8 py-12">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-6 font-serif text-lg leading-relaxed">
            {paragraph}
          </p>
        ))}
      </article>

      <ConfirmDialog ref={confirmDialogRef} />
      <BlogPostFormDialog ref={editDialogRef} />
    </div>
  );
}
