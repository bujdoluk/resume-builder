import { expect, test } from "@playwright/test";

test("anonymous visitor can build and save a cover letter", async ({ page }) => {
  // No landing-page CTA links to the cover letter builder (only resumes do) —
  // it's normally reached via the in-app sidebar, so we navigate directly.
  await page.goto("/cover-letter");

  const acceptCookies = page.getByRole("button", { name: "Accept All" });
  await acceptCookies.click();
  await acceptCookies.waitFor({ state: "hidden" });

  // Your Information — "Jane Doe" also appears on the Letter section's
  // "signature" field further down, which is a deliberate alias for this
  // same senderName value (not a separate field), so only the first match
  // needs to be filled.
  await page.locator('input[placeholder="Jane Doe"]:visible').first().fill("Alex Morgan");
  await page
    .locator('input[placeholder="123 Main St, Springfield"]:visible')
    .first()
    .fill("456 Oak Ave, Metropolis");
  await page.locator('input[placeholder="jane@example.com"]:visible').first().fill("alex.morgan@example.com");
  await page.locator('input[placeholder="+1 555 0100"]:visible').first().fill("+1 415 555 0134");

  // Date
  await page.locator('input[placeholder="e.g. 01-06-2026"]:visible').first().fill("01-08-2026");

  // Recipient Information
  await page.locator('input[placeholder="Hiring Manager"]:visible').first().fill("Jamie Recruiter");
  await page.locator('input[placeholder="Acme Inc."]:visible').first().fill("Acme Inc.");
  await page.locator('input[placeholder="e.g. Illinois"]:visible').first().fill("Illinois");
  await page.locator('input[placeholder="e.g. 62704"]:visible').first().fill("62704");
  await page.locator('input[placeholder="+1 555 0200"]:visible').first().fill("+1 415 555 0200");
  await page.locator('input[placeholder="hr@acme.com"]:visible').first().fill("hr@acme.com");

  // Subject
  await page
    .locator('input[placeholder="Application for Frontend Developer"]:visible')
    .first()
    .fill("Application for Backend Engineer");

  // Letter
  await page.locator('input[placeholder="Dear Hiring Manager,"]:visible').first().fill("Dear Jamie,");
  await page
    .locator('textarea[placeholder="Explain why you\'re a great fit for this role..."]:visible')
    .first()
    .fill("I have spent eight years building reliable backend systems and would love to bring that experience to your team.");
  await page.locator('input[placeholder="Sincerely,"]:visible').first().fill("Best regards,");

  // Custom Field
  await page.locator('input[placeholder="e.g. Slovak"]:visible').first().fill("Willing to relocate");

  await page.getByRole("button", { name: /^Save$/i }).click();

  const nameDialogInput = page.locator('dialog[open] input[type="text"]');
  if (await nameDialogInput.count()) {
    await nameDialogInput.fill("Alex Morgan - Backend Engineer Cover Letter");
    await page.getByRole("button", { name: /^Save$/i }).last().click();
  }

  await expect(page).toHaveURL(/id=/, { timeout: 10_000 });
});
