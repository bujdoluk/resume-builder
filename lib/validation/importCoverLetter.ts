import { z } from "zod";

export const importCoverLetterBodySchema = z.object({
  fileBase64: z.string("missingImportCoverLetterFile").min(1, "missingImportCoverLetterFile"),
  fileType: z.enum(["pdf", "docx"], "invalidImportCoverLetterFileType"),
});
