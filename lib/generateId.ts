/**
 * Generates a random id for a new resume entry (work experience, education,
 * skill, etc.). `crypto.randomUUID()` is restricted to secure contexts per
 * the Web Crypto API spec — it throws "crypto.randomUUID is not a function"
 * on a plain-http origin that isn't literally `localhost`/`127.0.0.1` (e.g.
 * a hosts-file-mapped custom hostname like `dev.quickresumebuilder.online`,
 * used elsewhere in this app for local hCaptcha testing). `getRandomValues`
 * has no such restriction, so it's used directly to hand-roll a UUID v4
 * whenever `randomUUID` isn't available.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
