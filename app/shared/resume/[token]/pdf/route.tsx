
import { pdf } from "@react-pdf/renderer";
import { RATE_LIMIT_SHARED_DOCUMENT_REQUESTS, RATE_LIMIT_SHARED_DOCUMENT_WINDOW } from "@/lib/constants";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { streamToBuffer } from "@/lib/pdf/streamToBuffer";
import { pdfTemplates } from "@/lib/pdf/templates";
import { checkRateLimit, getRequestIp } from "@/lib/rateLimit";
import { getResumeByShareToken } from "@/lib/supabase/resumes";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

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
  const resume = await getResumeByShareToken(supabase, token);
  if (!resume) {
    return new Response("Not found", { status: 404 });
  }

  registerPdfFonts();
  const Template = pdfTemplates[resume.templateId];
  const stream = await pdf(
    <Template
      data={resume.data}
      sectionOrder={resume.sectionOrder}
      color={resume.color}
      font={resume.font}
      fontSize={resume.fontSize ?? undefined}
      visibleFields={resume.visibleFields}
      modernSectionZones={resume.modernSectionZones}
    />,
  ).toBuffer();
  const buffer = await streamToBuffer(stream);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resume.name.replace(/["\\]/g, "")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
