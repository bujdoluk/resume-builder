
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL } from "@/lib/supportEmail";

const title = "Privacy Policy — QuickResumeBuilder.online";
const description = "How QuickResumeBuilder.online collects, uses, and protects your information.";
const lastUpdated = "22 July 2026";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title,
    description,
    url: "/privacy",
    siteName: "QuickResumeBuilder.online",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Page() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-base-content/60 mt-2 text-sm">Last updated: {lastUpdated}</p>

        <p className="mt-6">
          QuickResumeBuilder.online (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides a free, in-browser
          resume and cover letter builder. This policy explains what information we collect when
          you use the service, why, and what choices you have about it.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">1. Information we collect</h2>
        <p>
          <strong>Account information.</strong> When you sign up with email/password or Google, we
          (via our authentication provider, Supabase) store your email address and an encrypted
          password or your Google account identifier. Before you sign up, we create an anonymous
          session so you can start building a resume and save your progress without an account —
          if you later sign up, that anonymous session and anything you saved under it become part
          of your new account.
        </p>
        <p className="mt-3">
          <strong>Resume and cover letter content.</strong> Whatever you type into the builder —
          your name, contact details, work history, and everything else — is stored so you can come
          back to it later. This is your content; we don&rsquo;t read it for any purpose other than
          displaying it back to you and, if you use the Email feature, sending the file you generate
          to the address you specify.
        </p>
        <p className="mt-3">
          <strong>Payment information.</strong> If you subscribe to a paid plan, payment is handled
          entirely by Stripe. We never see or store your card details — Stripe passes us only your
          subscription status and billing period, which we use to unlock paid features.
        </p>
        <p className="mt-3">
          <strong>Support conversations.</strong> If you opt in to live chat (see Cookies below) and
          message us, those conversations are handled by Tawk.to.
        </p>
        <p className="mt-3">
          <strong>AI coherence check.</strong> The ATS Checker&rsquo;s optional &ldquo;Check
          Coherence&rdquo; button sends the text of your resume or cover letter to Groq, an AI
          inference provider, to assess whether it reads as coherent, plausible content. This only
          happens when you explicitly click that button — it&rsquo;s never sent automatically.
        </p>
        <p className="mt-3">
          <strong>Usage data.</strong> If you opt in to analytics (see Cookies below), we collect
          anonymized, aggregate usage data via Vercel Analytics and Speed Insights — page views and
          performance metrics, not the content of your resume.
        </p>
        <p className="mt-3">
          <strong>Error diagnostics.</strong> If something breaks, technical error details (e.g. a
          stack trace) may be automatically reported to Sentry, our error-monitoring provider, so we
          can fix it. This doesn&rsquo;t depend on the cookie choices below, the same way a site
          simply staying online doesn&rsquo;t.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">2. How we use this information</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>To provide the service — building, saving, and exporting your resumes and cover letters.</li>
          <li>To operate your account — authentication, subscription status, and billing.</li>
          <li>To send transactional email — a welcome email when you subscribe, password reset links, and any file you explicitly ask us to email.</li>
          <li>To protect the service from bots and abuse (hCaptcha).</li>
          <li>With your consent, to understand aggregate usage and improve the product, and to provide live chat support.</li>
        </ul>
        <p className="mt-3">We do not sell your personal information, ever.</p>

        <h2 id="cookies" className="mt-8 mb-3 text-xl font-bold">3. Cookies</h2>
        <p>
          We use three categories of cookies/local storage, matching the choices in the &ldquo;Cookie
          preferences&rdquo; link in the footer of this site:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong>Necessary</strong> — your login session (Supabase) and bot-protection challenges
            (hCaptcha). Always on: the site can&rsquo;t function without these, and GDPR/ePrivacy
            don&rsquo;t require consent for strictly necessary technology.
          </li>
          <li>
            <strong>Analytics</strong> — Vercel Analytics and Speed Insights. Off by default; only
            loads once you opt in.
          </li>
          <li>
            <strong>Support chat</strong> — the Tawk.to live chat widget. Off by default; only loads
            once you opt in.
          </li>
        </ul>
        <p className="mt-3">
          You can change your choice at any time using the &ldquo;Cookie preferences&rdquo; link in
          the footer of any page. Your decision is stored in your browser&rsquo;s local storage, not
          a tracking cookie.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">4. Third-party services we use</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Supabase</strong> — authentication and database hosting.</li>
          <li><strong>Stripe</strong> — payment processing for paid subscriptions.</li>
          <li><strong>Resend</strong> — transactional email delivery.</li>
          <li><strong>Tawk.to</strong> — live chat support (opt-in only).</li>
          <li><strong>Groq</strong> — AI-based coherence check for the ATS Checker (opt-in only).</li>
          <li><strong>hCaptcha</strong> — bot and abuse protection.</li>
          <li><strong>Sentry</strong> — error monitoring.</li>
          <li><strong>Vercel</strong> — hosting, analytics, and performance monitoring (analytics opt-in only).</li>
        </ul>
        <p className="mt-3">
          Each of these providers processes data under their own privacy policy, only for the
          purposes described above.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">5. Data retention</h2>
        <p>
          We keep your account and its saved resumes/cover letters for as long as your account
          exists. Anonymous (pre-signup) sessions that are never converted into a real account are
          periodically cleaned up.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">6. Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct, export, or delete
          your personal information. You can export a copy of everything tied to your account, or
          permanently delete your account (which also cancels any active subscription), yourself at
          any time from your <a href="/account" className="link">account page</a>. For anything
          those tools don&rsquo;t cover, contact us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="link">
            {SUPPORT_EMAIL}
          </a>{" "}
          and we&rsquo;ll act on your request.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">7. Children&rsquo;s privacy</h2>
        <p>This service is not directed at children under 16, and we don&rsquo;t knowingly collect information from them.</p>

        <h2 className="mt-8 mb-3 text-xl font-bold">8. Changes to this policy</h2>
        <p>
          If we make material changes to this policy, we&rsquo;ll update the &ldquo;Last
          updated&rdquo; date above.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">9. Contact</h2>
        <p>
          Questions about this policy? Email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="link">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
      <Footer />
    </div>
  );
}
