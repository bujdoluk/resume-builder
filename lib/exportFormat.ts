/**
 * The two file formats a resume/cover letter can be downloaded or emailed
 * as — shared between `DownloadButton`, `EmailButton`, `ExportFormatMenu`,
 * and both builders so they all agree on the same two values.
 */
export type ExportFormat = "pdf" | "txt";
