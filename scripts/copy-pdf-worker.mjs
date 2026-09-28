#!/usr/bin/env node
// Copies the pdfjs worker into public/ so it loads as a static asset. Runs on postinstall.
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
