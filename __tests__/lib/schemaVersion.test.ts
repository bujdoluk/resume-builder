import { describe, expect, it } from "vitest";
import { createVersionedCodec } from "@/lib/schemaVersion";

describe("createVersionedCodec", () => {
  describe("stamp", () => {
    it("adds the current version to the given data without mutating the input", () => {
      const codec = createVersionedCodec(3, {});
      const input = { name: "Jane" };

      const stamped = codec.stamp(input);

      expect(stamped).toEqual({ name: "Jane", __schemaVersion: 3 });
      expect(input).toEqual({ name: "Jane" });
    });
  });

  describe("migrate", () => {
    it("treats data with no version marker as version 0", () => {
      const migrateFrom0 = (data: Record<string, unknown>) => ({ ...data, upgraded: true });
      const codec = createVersionedCodec(1, { 0: migrateFrom0 });

      expect(codec.migrate({ name: "Jane" })).toEqual({ name: "Jane", upgraded: true, __schemaVersion: 1 });
    });

    it("runs each step in sequence up to the current version", () => {
      const codec = createVersionedCodec(3, {
        0: (data) => ({ ...data, v1: true }),
        1: (data) => ({ ...data, v2: true }),
        2: (data) => ({ ...data, v3: true }),
      });

      expect(codec.migrate({})).toEqual({
        v1: true,
        v2: true,
        v3: true,
        __schemaVersion: 3,
      });
    });

    it("starts from the stored version, not from 0, when one is present", () => {
      const codec = createVersionedCodec(2, {
        0: () => {
          throw new Error("should not run — data is already past version 0");
        },
        1: (data) => ({ ...data, upgradedFrom1: true }),
      });

      expect(codec.migrate({ __schemaVersion: 1 })).toEqual({
        __schemaVersion: 2,
        upgradedFrom1: true,
      });
    });

    it("stops without throwing when a migration step is missing, leaving the rest to the caller's schema", () => {
      const codec = createVersionedCodec(5, {});

      expect(codec.migrate({ name: "Jane", __schemaVersion: 2 })).toEqual({
        name: "Jane",
        __schemaVersion: 2,
      });
    });

    it("treats non-object input (null, array, primitive) as empty data", () => {
      // No migration step is registered for version 0, so this stays at
      // version 0 rather than reaching currentVersion — see the "stops
      // without throwing when a migration step is missing" case above.
      const codec = createVersionedCodec(1, {});

      expect(codec.migrate(null)).toEqual({ __schemaVersion: 0 });
      expect(codec.migrate(["not", "an", "object"])).toEqual({ __schemaVersion: 0 });
      expect(codec.migrate("just a string")).toEqual({ __schemaVersion: 0 });
    });

    it("does not mutate the raw input object", () => {
      const codec = createVersionedCodec(1, { 0: (data) => ({ ...data, upgraded: true }) });
      const raw = { name: "Jane" };

      codec.migrate(raw);

      expect(raw).toEqual({ name: "Jane" });
    });
  });
});
