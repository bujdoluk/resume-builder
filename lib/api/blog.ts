import { API_LOCALE_HEADER } from "@/lib/apiLocaleHeader";
import type { BlogCategoryKey } from "@/types/blog";

export interface BlogPostInput {
  title: string;
  subtitle: string;
  content: string;
  category: BlogCategoryKey;
  publishedAt: string;
  authorName: string;
  authorAvatarUrl: string | null;
  readTime: string;
}

export function requestCreateBlogPost(input: BlogPostInput, locale: string): Promise<Response> {
  return fetch("/api/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify(input),
  });
}

export function requestUpdateBlogPost(id: string, input: BlogPostInput, locale: string): Promise<Response> {
  return fetch(`/api/blog/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", [API_LOCALE_HEADER]: locale },
    body: JSON.stringify(input),
  });
}

export function requestDeleteBlogPost(id: string, locale: string): Promise<Response> {
  return fetch(`/api/blog/${id}`, {
    method: "DELETE",
    headers: { [API_LOCALE_HEADER]: locale },
  });
}
