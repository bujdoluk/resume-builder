import { expect, test } from "@playwright/test";

test("anonymous visitor can build and save a resume from the landing page", async ({
  page,
}) => {
  await page.goto("/");

  const acceptCookies = page.getByRole("button", { name: "Accept All" });
  await acceptCookies.click();
  await acceptCookies.waitFor({ state: "hidden" });

  await page.getByRole("link", { name: "Create Resume" }).first().click();
  await page.waitForURL("**/app");

  await page.locator('input[name="name"]:visible').first().fill("Alex Morgan");
  await page.locator('input[name="jobTitle"]:visible').first().fill("Backend Engineer");
  await page.locator('input[name="phone"]:visible').first().fill("+1 415 555 0134");
  await page.locator('input[name="email"]:visible').first().fill("alex.morgan@example.com");
  await page.locator('input[name="address"]:visible').first().fill("San Francisco, CA");
  await page.locator('input[name="website"]:visible').first().fill("alexmorgan.dev");
  await page.locator('input[name="linkedin"]:visible').first().fill("linkedin.com/in/alexmorgan");
  await page
    .locator('textarea[placeholder="Write a short summary about yourself..."]:visible')
    .first()
    .fill("Backend engineer focused on distributed systems and reliability.");

  await page.getByRole("button", { name: /Add Work Experience/i }).click();
  await page.locator('input[placeholder="Your position"]:visible').first().fill("Backend Engineer");
  await page
    .locator('textarea[placeholder="Describe your responsibilities and achievements..."]:visible')
    .first()
    .fill("Built and maintained the core payments API.");

  await page.getByRole("button", { name: /Add Education/i }).click();
  await page.locator('input[placeholder="School name"]:visible').first().fill("State University");
  await page.locator('input[placeholder="Subject of study"]:visible').first().fill("Computer Science");

  await page.getByRole("button", { name: /Add Skill/i }).click();
  await page.locator('input[placeholder="Your skill"]:visible').first().fill("Distributed Systems");

  await page.getByRole("button", { name: /Add Language/i }).click();
  await page.locator('input[placeholder="Your language"]:visible').first().fill("English");

  await page.getByRole("button", { name: /Add Certification/i }).click();
  await page
    .locator('input[placeholder="Certification name"]:visible')
    .first()
    .fill("AWS Certified Developer");

  await page.getByRole("button", { name: /Add Interest/i }).click();
  await page.locator('input[placeholder="Your interest"]:visible').first().fill("Cycling");

  await page.getByRole("button", { name: /^Save$/i }).click();

  const nameDialogInput = page.locator('dialog[open] input[type="text"]');
  if (await nameDialogInput.count()) {
    await nameDialogInput.fill("Alex Morgan - Backend Engineer");
    await page.getByRole("button", { name: /^Save$/i }).last().click();
  }

  await expect(page).toHaveURL(/resumeId=/, { timeout: 10_000 });
});
