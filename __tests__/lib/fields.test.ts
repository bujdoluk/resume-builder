import { describe, expect, it } from "vitest";
import { visibleFieldsSchema } from "@/lib/fields";

describe("visibleFieldsSchema", () => {
  it("passes through a fully-valid list", () => {
    expect(visibleFieldsSchema.parse(["name", "email"])).toEqual(["name", "email"]);
  });

  it("drops individually-invalid entries, keeping the rest in order", () => {
    expect(visibleFieldsSchema.parse(["name", "not-a-real-field", "email"])).toEqual([
      "name",
      "email",
    ]);
  });

  it("falls back to an empty list for non-array input", () => {
    expect(visibleFieldsSchema.parse("not an array")).toEqual([]);
    expect(visibleFieldsSchema.parse(null)).toEqual([]);
  });
});
