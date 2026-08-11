import { z } from "zod";
import { blogCategories } from "@/lib/supabase/blogPosts";
import type { BlogCategoryKey } from "@/types/blog";

const trimmedRequired = () => z.string("invalidInput").trim().min(1, "invalidInput");

export const blogPostBodySchema = z.object({
  category: z.string("invalidInput")
    .refine((value) => blogCategories.includes(value as BlogCategoryKey), "invalidInput"),
  title: trimmedRequired(),
  subtitle: trimmedRequired(),
  content: trimmedRequired(),
  authorName: trimmedRequired(),
  authorAvatarUrl: z.string().trim().nullish().transform((value) => (value ? value : null)),
  readTime: trimmedRequired(),
  publishedAt: z.string("invalidInput").refine((value) => value.trim().length > 0, "invalidInput"),
});
