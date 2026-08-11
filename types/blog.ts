export type BlogCategoryKey =
  | "resumeTips"
  | "coverLetters"
  | "interviewPrep"
  | "careerAdvice"
  | "jobSearch";

export interface BlogPost {
  id: string;
  slug: string;
  category: BlogCategoryKey;
  title: string;
  subtitle: string;
  content: string;
  authorName: string;
  authorAvatarUrl: string | null;
  readTime: string;
  publishedAt: string;
}

export interface Blog {
  category: BlogCategoryKey;
  title: string;
  subtitle: string;
  content: string;
  authorName: string;
  authorAvatarUrl: string | null;
  readTime: string;
  publishedAt: string;
}
