import * as Sentry from "@sentry/nextjs";
import { errorResponse } from "@/lib/apiErrors";
import { validateBody } from "@/lib/apiValidation";
import {
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_TOO_MANY_REQUESTS,
  MAX_IMPORT_EXTRACTED_TEXT_LENGTH,
  MAX_IMPORT_FILE_BYTES,
  RATE_LIMIT_IMPORT_COVER_LETTER_REQUESTS,
  RATE_LIMIT_IMPORT_COVER_LETTER_WINDOW,
} from "@/lib/constants";
import { parseCoverLetterText } from "@/lib/coverLetterImport/parseCoverLetterText";
import { extractDocumentText, DocumentImportExtractionError } from "@/lib/documentImport/extractText";
import { checkRateLimit, getRequestIp } from "@/lib/rateLimit";
import { importCoverLetterBodySchema } from "@/lib/validation/importCoverLetter";

export async function POST(request: Request) {
  const allowed = await checkRateLimit(
    "import-cover-letter",
    getRequestIp(request),
    RATE_LIMIT_IMPORT_COVER_LETTER_REQUESTS,
    RATE_LIMIT_IMPORT_COVER_LETTER_WINDOW,
  );
  if (!allowed) {
    return errorResponse(HTTP_TOO_MANY_REQUESTS, "rateLimited", request);
  }

  const body = await request.json().catch(() => null);

  const parsed = validateBody(importCoverLetterBodySchema, body ?? {});
  if (!parsed.success) {
    return errorResponse(HTTP_BAD_REQUEST, parsed.key, request);
  }
  const { fileBase64, fileType } = parsed.data;

  const fileBuffer = Buffer.from(fileBase64, "base64");
  if (fileBuffer.byteLength === 0 || fileBuffer.byteLength > MAX_IMPORT_FILE_BYTES) {
    return errorResponse(HTTP_BAD_REQUEST, "importCoverLetterFileTooLarge", request);
  }

  if (!process.env.GROQ_API_KEY) {
    return errorResponse(HTTP_BAD_GATEWAY, "importCoverLetterUnavailable", request);
  }

  let text: string;
  try {
    text = await extractDocumentText(fileBuffer, fileType);
  } catch (error) {
    // Log the cause: extractDocumentText wraps every failure, which would hide the pdfjs/mammoth error.
    console.error(error, error instanceof DocumentImportExtractionError ? error.cause : undefined);
    if (!(error instanceof DocumentImportExtractionError)) {
      Sentry.captureException(error);
    }
    return errorResponse(HTTP_BAD_REQUEST, "importCoverLetterParsingFailed", request);
  }

  try {
    const data = await parseCoverLetterText(text.slice(0, MAX_IMPORT_EXTRACTED_TEXT_LENGTH));
    return Response.json({ data });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return errorResponse(HTTP_BAD_GATEWAY, "coverLetterImportFailed", request);
  }
}
