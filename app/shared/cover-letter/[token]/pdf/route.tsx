
import { RATE_LIMIT_SHARED_DOCUMENT_REQUESTS, RATE_LIMIT_SHARED_DOCUMENT_WINDOW } from "@/lib/constants";
import { checkRateLimit, getRequestIp } from "@/lib/rateLimit";
import { getCoverLetterByShareToken } from "@/lib/supabase/coverLetters";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

// Cover letters don't persist their own template/color/font/section-order
// per document (see CoverLetterBuilder.tsx — those live in the app-wide
// AppState context, not the saved row), so the shared view always renders
// with the default template and section order.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const allowed = await checkRateLimit(
    "shared-document",
    getRequestIp(request),
    RATE_LIMIT_SHARED_DOCUMENT_REQUESTS,
    RATE_LIMIT_SHARED_DOCUMENT_WINDOW,
  );
  if (!allowed) {
    return new Response("Too many requests", { status: 429 });
  }

  const { token } = await params;
  const supabase = createServiceRoleClient();
  const coverLetter = await getCoverLetterByShareToken(supabase, token);
  if (!coverLetter) {
    return new Response("Not found", { status: 404 });
  }

  // Dynamically imported — see the matching comment in
  // app/shared/resume/[token]/pdf/route.tsx for why (i18n singleton
  // touching client-only React APIs at module-init time breaks Next.js's
  // build-time route analysis if imported at the top level).
  const [{ pdf }, { registerPdfFonts }, { coverLetterPdfTemplates }, { streamToBuffer }, sections, templates] =
    await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/pdf/fonts"),
      import("@/lib/pdf/coverLetterTemplates"),
      import("@/lib/pdf/streamToBuffer"),
      import("@/lib/coverLetterSections"),
      import("@/lib/coverLetterTemplates"),
    ]);

  registerPdfFonts();
  const Template = coverLetterPdfTemplates[templates.defaultCoverLetterTemplateId];
  const stream = await pdf(
    <Template data={coverLetter.data} sectionOrder={sections.defaultCoverLetterSectionOrder} />,
  ).toBuffer();
  const buffer = await streamToBuffer(stream);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${coverLetter.name.replace(/["\\]/g, "")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
