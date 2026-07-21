
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { SUPPORT_EMAIL } from "@/lib/supportEmail";

const title = "Terms of Service — QuickResumeBuilder.online";
const description = "The terms that govern your use of QuickResumeBuilder.online.";
const lastUpdated = "20 July 2026";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title,
    description,
    url: "/terms",
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
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-base-content/60 mt-2 text-sm">Last updated: {lastUpdated}</p>

        <p className="mt-6">
          These terms govern your use of QuickResumeBuilder.online (&ldquo;the service&rdquo;). By
          using it, you agree to them. If you don&rsquo;t agree, please don&rsquo;t use the service.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">1. The service</h2>
        <p>
          QuickResumeBuilder.online is a free, in-browser resume and cover letter builder. Core
          features — building, previewing, downloading, and emailing a resume or cover letter — are
          free to use, with no account required. Saving multiple documents to an account beyond the
          free tier&rsquo;s limit requires a paid subscription (see Section 4).
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">2. Accounts</h2>
        <p>
          You may use the service anonymously, in which case your work is tied to a temporary
          session rather than a permanent account. Creating a real account (email/password or
          Google) carries that work over. You&rsquo;re responsible for keeping your login
          credentials secure and for anything that happens under your account.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">3. Your content</h2>
        <p>
          You retain all rights to the content you enter into the builder — your resume, cover
          letter, and any personal information within them. We claim no ownership over it. You&rsquo;re
          responsible for the accuracy and legality of what you submit, and for not entering
          anyone else&rsquo;s personal information without their permission.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">4. Subscriptions and billing</h2>
        <p>
          Paid plans (Pro monthly, or Annual) are billed and processed by Stripe. Subscribing
          unlocks unlimited saved resumes and cover letters. You can cancel at any time from your
          account page; cancellation takes effect at the end of your current billing period, and we
          don&rsquo;t offer prorated refunds for the remainder of a period you&rsquo;ve already paid
          for. Prices may change; we&rsquo;ll give you notice before any change affects an active
          subscription.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="mt-3 list-disc space-y-1 pl-6">
          <li>Use the service to send spam, harassment, or unlawful content, including via the Email export feature.</li>
          <li>Attempt to bypass rate limits, bot protection, or any other technical safeguard.</li>
          <li>Interfere with the service&rsquo;s normal operation or attempt unauthorized access to other users&rsquo; data.</li>
          <li>Use the service for any unlawful purpose.</li>
        </ul>
        <p className="mt-3">We may suspend or terminate access for violating these terms.</p>

        <h2 className="mt-8 mb-3 text-xl font-bold">6. Intellectual property</h2>
        <p>
          The service itself — its design, templates, code, and branding — belongs to us and is
          protected by applicable intellectual property law. These terms don&rsquo;t grant you any
          rights to it beyond using the service as intended.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">7. Disclaimers</h2>
        <p>
          The service is provided &ldquo;as is&rdquo;, without warranties of any kind. We don&rsquo;t
          guarantee that any resume or cover letter you create will result in a job offer, interview,
          or any particular outcome.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">8. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, we aren&rsquo;t liable for any indirect,
          incidental, or consequential damages arising from your use of the service.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">9. Termination</h2>
        <p>
          You can stop using the service, or delete your account, at any time by contacting us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="link">
            {SUPPORT_EMAIL}
          </a>
          . We may suspend or terminate accounts that violate these terms.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">10. Governing law</h2>
        <p>
          These terms are governed by the laws of <strong>[Insert your governing-law jurisdiction here]</strong>,
          without regard to its conflict-of-law principles.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">11. Changes to these terms</h2>
        <p>
          If we make material changes to these terms, we&rsquo;ll update the &ldquo;Last
          updated&rdquo; date above.
        </p>

        <h2 className="mt-8 mb-3 text-xl font-bold">12. Contact</h2>
        <p>
          Questions about these terms? Email us at{" "}
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
