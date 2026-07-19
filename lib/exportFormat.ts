/**
 * The file formats a resume/cover letter can be downloaded or emailed as —
 * shared between `DownloadButton`, `EmailButton`, `ExportFormatMenu`, and
 * both builders so they all agree on the same set of values.
 */
export type ExportFormat = "pdf" | "docx" | "txt";
