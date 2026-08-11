import { Document, Packer, Paragraph, TextRun } from "docx";
import { Document as PdfDocument, Page as PdfPage, pdf, Text as PdfText } from "@react-pdf/renderer";
import React from "react";
import { describe, expect, it } from "vitest";
import { extractDocumentText, DocumentImportExtractionError } from "@/lib/documentImport/extractText";

async function buildPdfBuffer(text: string): Promise<Buffer> {
  const element = React.createElement(
    PdfDocument,
    null,
    React.createElement(PdfPage, null, React.createElement(PdfText, null, text)),
  );
  const stream = await pdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function buildDocxBuffer(text: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{ children: [new Paragraph({ children: [new TextRun(text)] })] }],
  });
  return Packer.toBuffer(doc);
}

describe("extractDocumentText", () => {
  it("extracts text from a real PDF", async () => {
    const buffer = await buildPdfBuffer("Jane Doe — Senior Software Engineer");
    const text = await extractDocumentText(buffer, "pdf");
    expect(text).toContain("Jane Doe");
    expect(text).toContain("Senior Software Engineer");
  });

  it("extracts text from a real DOCX", async () => {
    const buffer = await buildDocxBuffer("John Smith — Product Manager");
    const text = await extractDocumentText(buffer, "docx");
    expect(text).toContain("John Smith");
    expect(text).toContain("Product Manager");
  });

  it("throws DocumentImportExtractionError for a corrupt PDF", async () => {
    await expect(extractDocumentText(Buffer.from("not a real pdf"), "pdf")).rejects.toBeInstanceOf(
      DocumentImportExtractionError,
    );
  });

  it("throws DocumentImportExtractionError for a corrupt DOCX", async () => {
    await expect(extractDocumentText(Buffer.from("not a real docx"), "docx")).rejects.toBeInstanceOf(
      DocumentImportExtractionError,
    );
  });

  it("throws DocumentImportExtractionError for a PDF with no extractable text", async () => {
    const buffer = await buildPdfBuffer("");
    await expect(extractDocumentText(buffer, "pdf")).rejects.toBeInstanceOf(DocumentImportExtractionError);
  });
});
