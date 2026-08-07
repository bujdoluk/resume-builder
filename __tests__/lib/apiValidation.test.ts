import { z } from "zod";
import { describe, expect, it } from "vitest";
import { validateBody } from "@/lib/apiValidation";

const schema = z.object({
  name: z.string("invalidInput").trim().min(1, "invalidInput"),
});

describe("validateBody", () => {
  it("returns success with the parsed (and transformed) data on a valid shape", () => {
    const result = validateBody(schema, { name: "  Jane  " });
    expect(result).toEqual({ success: true, data: { name: "Jane" } });
  });

  it("maps a schema failure to the ApiErrorKey set as that field's message", () => {
    const result = validateBody(schema, { name: "   " });
    expect(result).toEqual({ success: false, key: "invalidInput" });
  });

  it("uses the first failing field's message as the key when several fields are invalid", () => {
    const multiField = z.object({
      to: z.string("invalidEmailAddress"),
      text: z.string("invalidTextData"),
    });
    const result = validateBody(multiField, {});
    expect(result).toEqual({ success: false, key: "invalidEmailAddress" });
  });
});
