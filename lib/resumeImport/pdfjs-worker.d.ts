// pdfjs-dist doesn't ship types for this subpath (it's meant to be loaded as
// a worker script, not imported as a module) — see extractText.ts for why we
// import it directly anyway.
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs";
