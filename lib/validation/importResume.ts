import { z } from "zod";

export const importResumeBodySchema = z.object({
  fileBase64: z.string("missingImportFile").min(1, "missingImportFile"),
  fileType: z.enum(["pdf", "docx"], "invalidImportFileType"),
});
