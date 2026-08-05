#!/usr/bin/env node
/**
 * Copies pdfjs-dist's worker script into public/ so it can be loaded as a
 * plain static asset (a simple string URL passed to
 * pdfjsLib.GlobalWorkerOptions.workerSrc) rather than relying on
 * bundler-specific `new Worker(new URL(...))` rewriting, which behaves
 * inconsistently across Turbopack/webpack for a worker constructed deep
 * inside a third-party package rather than at the call site.
 *
 * Runs automatically via the "postinstall" script, so it always matches
 * whatever pdfjs-dist version is actually installed — never commit a stale
 * copy by hand.
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(
  new URL("../node_modules/pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
);
const destination = fileURLToPath(new URL("../public/pdf.worker.min.mjs", import.meta.url));

if (!existsSync(source)) {
  console.error(`pdfjs-dist worker not found at ${source} — is pdfjs-dist installed?`);
  process.exit(1);
}

copyFileSync(source, destination);
console.log(`Copied pdf.worker.min.mjs to public/`);
