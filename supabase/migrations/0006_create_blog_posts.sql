create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null check (category in ('resumeTips', 'coverLetters', 'interviewPrep', 'careerAdvice', 'jobSearch')),
  title text not null,
  subtitle text not null,
  content text not null,
  author_name text not null,
  author_avatar_url text,
  read_time text not null,
  published_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc);

alter table public.blog_posts enable row level security;

drop policy if exists "Anyone can view blog posts" on public.blog_posts;
create policy "Anyone can view blog posts" on public.blog_posts
  for select using (true);

drop policy if exists "Admins can insert blog posts" on public.blog_posts;
create policy "Admins can insert blog posts" on public.blog_posts
  for insert with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

insert into public.blog_posts (slug, category, title, subtitle, content, author_name, read_time, published_at) values
  ('10-resume-mistakes-that-cost-you-the-interview', 'resumeTips', '10 Resume Mistakes That Cost You the Interview', 'From generic objective statements to walls of text — here are the most common resume mistakes and how to fix them fast.', 'Recruiters spend an average of seven seconds on a first pass through your resume. In that time, small mistakes can quietly move you from the "yes" pile to the "no" pile — before anyone even gets to your actual experience.

1. Leading with a generic objective statement

"Seeking a challenging position where I can grow professionally" tells a hiring manager nothing about what you actually do. Replace the objective with a two- or three-line summary that states your role, your strongest skill, and the kind of impact you''ve made.

2. Turning your resume into a wall of text

Dense paragraphs get skimmed, not read. Break your experience into short, scannable bullet points — one accomplishment per line, each one starting with a strong verb.

If a recruiter has to work to find your best accomplishment, they''ll assume you don''t have one.

3. Listing duties instead of results

"Responsible for managing social media accounts" describes a job description, not your performance in it. Wherever possible, attach a number: followers gained, engagement lift, campaigns shipped.

4. Using one resume for every application

Applicant tracking systems and human reviewers both look for alignment between your resume and the specific role. Spend ten minutes tailoring your summary and top bullets to match the language of the job posting before you hit submit.

None of these fixes require rewriting your resume from scratch — just a closer look at the sections recruiters read first.', 'QuickResumeBuilder Team', '5 min read', '2026-06-02'),
  ('how-to-write-a-cover-letter-that-gets-read', 'coverLetters', 'How to Write a Cover Letter That Actually Gets Read', 'Skip the clichés. Learn how to open strong, connect your experience to the role, and close with confidence.', 'A cover letter that opens with "I am writing to apply for..." has already lost its reader. The best cover letters read less like a form letter and more like the opening of a conversation.

Start with something specific

Reference a detail about the company, the team, or the role that shows you''ve actually researched it — a recent product launch, a shared value, a problem you know they''re solving. Generic openings signal a generic application.

Connect your experience to their problem

Instead of restating your resume, pick one or two accomplishments and explain why they matter for this specific role. Show the hiring manager you understand what they need, not just what you''ve done.

Your resume shows what you''ve done. Your cover letter shows why it matters to them.

Close with confidence, not desperation

Skip "I hope to hear from you soon" in favor of a direct, forward-looking close: what you''re looking forward to discussing, or what you''d bring to the team in the first ninety days.

Keep the whole letter under a page — three or four short paragraphs is plenty. A cover letter''s job is to earn you an interview, not to summarize your entire career.', 'QuickResumeBuilder Team', '4 min read', '2026-06-09'),
  ('ats-friendly-resumes-what-actually-works', 'resumeTips', 'ATS-Friendly Resumes: What Actually Works in 2026', 'Applicant tracking systems reject more resumes than hiring managers do. Here''s how to format yours so it gets seen.', 'Applicant tracking systems (ATS) parse your resume into structured data before a human ever sees it — and a surprising number of well-qualified resumes get lost in that process, not because of the candidate''s experience, but because of formatting.

Keep the structure simple

Multi-column layouts, text boxes, and graphics can confuse parsers, scrambling your work history or dropping sections entirely. A single-column layout with clear, standard section headings — Experience, Education, Skills — parses reliably across almost every system.

Match the language of the job posting

Most ATS platforms rank resumes by keyword relevance. If the posting says "project management," don''t only write "managed projects" — use the same phrasing the employer used, naturally, in context.

The ATS doesn''t reject good candidates. It rejects resumes it can''t read.

Save it as the right file type

Unless a posting specifically requests otherwise, a PDF built from a clean, text-based layout is the safest choice — it preserves formatting while remaining fully parsable, as long as it wasn''t exported from a scanned image or a heavily designed template.

Formatting for the ATS and formatting for a human reader aren''t actually in conflict — the same clean, well-organized resume works for both.', 'QuickResumeBuilder Team', '6 min read', '2026-06-16'),
  ('5-interview-questions-to-always-prepare-for', 'interviewPrep', '5 Interview Questions You Should Always Prepare For', 'Behavioral questions catch most candidates off guard. Practice these answers before your next interview.', 'Technical skills get you the interview. How you talk about your experience is what gets you the offer — and behavioral questions are where most candidates are least prepared.

"Tell me about a time you failed."

Interviewers aren''t looking for a disaster story — they''re looking for self-awareness. Pick a real, moderate-stakes failure, focus most of your answer on what you changed afterward, and keep the ending forward-looking.

"Describe a conflict with a coworker."

Avoid painting the other person as the villain. Employers are listening for how you handle disagreement professionally — the specific steps you took to understand their perspective and reach a resolution.

Every behavioral question is really asking: how do you behave under pressure?

"Why are you leaving your current role?"

Frame this around what you''re moving toward, not what you''re running from. Even if the honest answer involves frustration, the version worth saying out loud is about growth, scope, or opportunity.

"Where do you see yourself in five years?"

You don''t need a five-year plan — you need to show that this role fits into a coherent direction, and that you''re not just looking for any job that will take you.

The structure that works for almost every behavioral question: situation, action, result — in that order, and weighted toward the action you took.', 'QuickResumeBuilder Team', '5 min read', '2026-06-23'),
  ('changing-careers-at-40-a-practical-guide', 'careerAdvice', 'Changing Careers at 40: A Practical Guide', 'It''s never too late to switch fields. Here''s how to reframe your experience and make the case to a new industry.', 'Switching industries at 40 feels riskier than it did at 25 — more to lose, more explaining to do, less patience for starting over. But a career change at this stage comes with an advantage most job seekers don''t have: two decades of transferable judgment.

Reframe your experience, don''t hide it

Trying to make your résumé look like it belongs to someone ten years younger rarely works, and it buries your biggest asset. Instead, translate your experience into language the new industry recognizes — the underlying skills, like leading teams, managing budgets, and solving ambiguous problems, usually transfer more directly than the job titles do.

Build a bridge before you jump

A complete pivot rarely happens in one move. Look for adjacent roles that combine what you already know with what you''re moving toward — a project manager moving into product, a teacher moving into corporate training — so your next job isn''t starting from zero.

You''re not starting over. You''re starting from twenty years ahead of where you started the first time.

Address the change directly

Don''t make a hiring manager guess why you''re switching fields. A brief, confident line in your cover letter or summary — why now, why this industry — closes the question before it becomes a doubt.

The goal isn''t to erase your past experience. It''s to show a new industry exactly why that experience makes you worth the risk.', 'QuickResumeBuilder Team', '7 min read', '2026-06-30'),
  ('remote-job-search-where-to-look-and-how-to-stand-out', 'jobSearch', 'Remote Job Search: Where to Look and How to Stand Out', 'The best remote roles rarely show up on general job boards. Here''s where to find them and how to apply well.', 'The best remote roles rarely make it to the top of a general job board search — by the time a fully remote posting has a thousand applicants, it''s already competitive. Finding the right opportunity means changing where you look, not just how often.

Go where remote-first companies actually post

Company career pages and remote-specific job boards surface roles days or weeks before they''re aggregated onto general search engines. Following a target list of remote-first companies directly is often more effective than scrolling an endless general feed.

Signal that you already know how to work remotely

Hiring managers for remote roles are quietly screening for one thing above all: can this person work independently without someone checking in on them every day? Use your resume and cover letter to show async communication habits, self-directed project ownership, and results you delivered without daily oversight.

Remote hiring managers aren''t just hiring your skills. They''re hiring your ability to work without being watched.

Network in the open

Remote teams often hire through referrals and public visibility — a thoughtful comment on a company''s public roadmap, a genuine connection made in a community Slack, or content shared in your area of expertise can put you on a hiring manager''s radar before a role is even posted.

Standing out remotely means demonstrating, not just claiming, that distance won''t be a problem.', 'QuickResumeBuilder Team', '5 min read', '2026-07-07')
on conflict (slug) do nothing;
