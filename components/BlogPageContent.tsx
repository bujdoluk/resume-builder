"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import AddBlogPostDialog, { type AddBlogPostDialogHandle } from "@/components/AddBlogPostDialog";
import { useIsAdmin } from "@/components/useIsAdmin";
import { categoryBadgeClass, type BlogPost } from "@/lib/supabase/blogPosts";

export default function BlogPageContent({ posts }: { posts: BlogPost[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const dialogRef = useRef<AddBlogPostDialogHandle>(null);

  async function handleAddPost() {
    const created = await dialogRef.current?.open();
    if (created) router.refresh();
  }

  return (
    <div className="bg-base-200 flex-1 p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("blog.pageTitle")}</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button type="button" className="btn btn-outline" onClick={handleAddPost}>
              {t("blog.addPost")}
            </button>
          )}
          <Link href="/app" className="btn btn-primary">
            {t("landing.ctaStart")}
          </Link>
        </div>
      </div>

      {posts.length === 0 && <p className="text-base-content/70 mb-8">{t("blog.comingSoon")}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="bg-base-100 border-base-300 hover:border-primary flex flex-col rounded-lg border p-6 transition-colors"
          >
            <span className={`badge badge-sm w-fit ${categoryBadgeClass[post.category]}`}>
              {t(`blog.categories.${post.category}`)}
            </span>
            <h2 className="mt-3 font-semibold">{post.title}</h2>
            <p className="text-base-content/70 mt-2 text-sm">{post.subtitle}</p>
            <span className="text-base-content/50 mt-4 text-xs">{post.readTime}</span>
          </Link>
        ))}
      </div>

      <AddBlogPostDialog ref={dialogRef} />
    </div>
  );
}
