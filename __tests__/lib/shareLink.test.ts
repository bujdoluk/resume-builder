import { describe, expect, it } from "vitest";
import { Temporal } from "temporal-polyfill";
import { isShareLinkActive } from "@/lib/shareLink";

describe("isShareLinkActive", () => {
  it("returns false when there is no expiry", () => {
    expect(isShareLinkActive(null)).toBe(false);
  });

  it("returns true when the expiry is in the future", () => {
    const future = Temporal.Now.instant().add({ hours: 24 }).toString();
    expect(isShareLinkActive(future)).toBe(true);
  });

  it("returns false when the expiry is in the past", () => {
    const past = Temporal.Now.instant().subtract({ hours: 24 }).toString();
    expect(isShareLinkActive(past)).toBe(false);
  });
});
