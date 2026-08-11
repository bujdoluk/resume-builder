import mammoth from "mammoth";
import type { ImportFileType } from "@/types/documentImport";

export class DocumentImportExtractionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DocumentImportExtractionError";
  }
}

// pdfjs-dist runs "workerless" in Node by loading its worker module into the
// main thread instead of a real Worker — but it locates that module via a
// runtime `import("./pdf.worker.mjs")` relative to its own bundled chunk.
// Under Next's bundler that chunk doesn't live next to a copy of the worker
// file, so the dynamic import 404s ("Setting up fake worker failed").
// pdfjs checks `globalThis.pdfjsWorker` *before* attempting that broken
// path, so importing the worker module normally (letting the bundler
// resolve it like any other import) and exposing it there sidesteps the
// runtime path lookup entirely. See pdfjs-dist's PDFWorker class
// (#mainThreadWorkerMessageHandler / _setupFakeWorkerGlobal).
async function ensurePdfWorkerRegistered() {
  if ((globalThis as { pdfjsWorker?: unknown }).pdfjsWorker) return;
  (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = await import(
    "pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  await ensurePdfWorkerRegistered();
  // The "standardFontDataUrl" warning pdfjs logs here is about rendering
  // embedded glyphs, which getTextContent() never needs.
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pageTexts.join("\n").trim();
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

/**
 * Extracts plain text from an uploaded document (resume or cover letter).
 * Throws DocumentImportExtractionError for a corrupt file or one with no
 * extractable text (e.g. a scanned/image-only PDF) — the caller maps that
 * to a clean user-facing error rather than sending empty input to Groq.
 */
export async function extractDocumentText(buffer: Buffer, fileType: ImportFileType): Promise<string> {
  let text: string;
  try {
    text = fileType === "pdf" ? await extractPdfText(buffer) : await extractDocxText(buffer);
  } catch (error) {
    if (error instanceof DocumentImportExtractionError) throw error;
    throw new DocumentImportExtractionError(
      `Failed to extract text from the uploaded ${fileType.toUpperCase()} file.`,
      { cause: error },
    );
  }

  if (!text) {
    throw new DocumentImportExtractionError(
      `The uploaded ${fileType.toUpperCase()} file has no extractable text.`,
    );
  }
  return text;
}
