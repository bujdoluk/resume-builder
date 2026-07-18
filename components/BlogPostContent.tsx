"use client";

/**
 * Body of a `/blog/[slug]` post page — Medium-style article layout: a
 * colored hero banner (category/title/byline) followed by a narrow,
 * serif-set reading column. `post` is fetched server-side
 * (app/blog/[slug]/page.tsx) from the `blog_posts` table — only "Back to
 * blog" and the category badge label are translated UI chrome; everything
 * else is the post's own stored text, authored directly (not via i18n).
 */
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import { ArrowLeftIcon } from "@/components/Icons";
import { categoryBadgeClass, type BlogPost } from "@/lib/supabase/blogPosts";

export default function BlogPostContent({ post }: { post: BlogPost }) {
  const { t, i18n } = useTranslation();
  const formattedDate = Temporal.PlainDate.from(post.publishedAt).toLocaleString(i18n.language, {
    dateStyle: "long",
  });
  const paragraphs = post.content.split(/\n\s*\n/);

  return (
    <div className="flex-1">
      <div className="bg-base-200 border-base-300 border-b px-8 py-12">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="link link-hover text-base-content/60 mb-6 flex w-fit items-center gap-1 text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4 stroke-current" />
            {t("blog.backToBlog")}
          </Link>

          <span className={`badge ${categoryBadgeClass[post.category]}`}>
            {t(`blog.categories.${post.category}`)}
          </span>

          <h1 className="mt-4 font-serif text-3xl leading-tight font-bold sm:text-4xl">{post.title}</h1>

          <p className="text-base-content/70 mt-4 text-lg">{post.subtitle}</p>

          <div className="mt-6 flex items-center gap-3">
            {post.authorAvatarUrl ? (
              <div className="avatar">
                <div className="w-9 rounded-full">
                  <img src={post.authorAvatarUrl} alt={post.authorName} />
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
    </div>
  );
}
