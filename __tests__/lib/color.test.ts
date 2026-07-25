import { describe, expect, it } from "vitest";
import { getContrastTextColor, mixChannels, tintBackground } from "@/lib/color";

describe("getContrastTextColor", () => {
  it("picks black text on a white background", () => {
    expect(getContrastTextColor("#ffffff")).toBe("#000000");
  });

  it("picks white text on a black background", () => {
    expect(getContrastTextColor("#000000")).toBe("#ffffff");
  });

  it("picks black text just above the brightness threshold", () => {
    // For an equal r=g=b gray, the weighted brightness formula's
    // coefficients sum to 1000, so brightness == the channel value itself.
    // 0x9c = 156, just over the 155 threshold.
    expect(getContrastTextColor("#9c9c9c")).toBe("#000000");
  });

  it("picks white text just below the brightness threshold", () => {
    // 0x9a = 154, just under the 155 threshold.
    expect(getContrastTextColor("#9a9a9a")).toBe("#ffffff");
  });
});

describe("mixChannels", () => {
  it("returns the original color at ratio 0", () => {
    expect(mixChannels("#3366cc", 0, 0)).toBe("#3366cc");
  });

  it("returns the target color at ratio 1", () => {
    expect(mixChannels("#3366cc", 255, 1)).toBe("#ffffff");
    expect(mixChannels("#3366cc", 0, 1)).toBe("#000000");
  });

  it("mixes halfway toward the target", () => {
    expect(mixChannels("#000000", 255, 0.5)).toBe("#808080");
  });
});

describe("tintBackground", () => {
  it("lightens the base color when paired with white contrast text", () => {
    const result = tintBackground("#222222", "#ffffff");
    expect(result).toBe(mixChannels("#222222", 255, 0.18));
  });

  it("darkens the base color when paired with black contrast text", () => {
    const result = tintBackground("#eeeeee", "#000000");
    expect(result).toBe(mixChannels("#eeeeee", 0, 0.08));
  });
});
