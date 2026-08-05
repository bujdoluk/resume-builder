
import { pdf } from "@react-pdf/renderer";
import { RATE_LIMIT_SHARED_DOCUMENT_REQUESTS, RATE_LIMIT_SHARED_DOCUMENT_WINDOW } from "@/lib/constants";
import { defaultCoverLetterSectionOrder } from "@/lib/coverLetterSections";
import { defaultCoverLetterTemplateId } from "@/lib/coverLetterTemplates";
import { coverLetterPdfTemplates } from "@/lib/pdf/coverLetterTemplates";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { streamToBuffer } from "@/lib/pdf/streamToBuffer";
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

  registerPdfFonts();
  const Template = coverLetterPdfTemplates[defaultCoverLetterTemplateId];
  const stream = await pdf(
    <Template data={coverLetter.data} sectionOrder={defaultCoverLetterSectionOrder} />,
  ).toBuffer();
  const buffer = await streamToBuffer(stream);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${coverLetter.name.replace(/["\\]/g, "")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
