import mammoth from "mammoth";
import type { ImportFileType } from "@/types/documentImport";

export class DocumentImportExtractionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DocumentImportExtractionError";
  }
}

// pdfjs checks globalThis.pdfjsWorker before its runtime import, which 404s under Next's bundler.
async function ensurePdfWorkerRegistered() {
  if ((globalThis as { pdfjsWorker?: unknown }).pdfjsWorker) return;
  (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = await import(
    "pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  await ensurePdfWorkerRegistered();
  // The standardFontDataUrl warning is harmless; getTextContent doesn't render glyphs.
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
