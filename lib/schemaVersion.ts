// Postgres doesn't enforce jsonb shape, so stored rows are upgraded step by step before validation.

export type MigrationStep = (data: Record<string, unknown>) => Record<string, unknown>;

const VERSION_FIELD = "__schemaVersion";

export interface VersionedCodec<T> {
  stamp: (data: T) => Record<string, unknown>;
  migrate: (raw: unknown) => Record<string, unknown>;
}

// Never change or remove a shipped migration; older rows may still need it. A missing step isn't an error.
export function createVersionedCodec<T extends Record<string, unknown>>(
  currentVersion: number,
  migrations: Record<number, MigrationStep>,
): VersionedCodec<T> {
  return {
    stamp(data) {
      return { ...data, [VERSION_FIELD]: currentVersion };
    },
    migrate(raw) {
      let data: Record<string, unknown> =
        raw && typeof raw === "object" && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};
      let version = typeof data[VERSION_FIELD] === "number" ? (data[VERSION_FIELD] as number) : 0;

      while (version < currentVersion) {
        const step = migrations[version];
        if (!step) break;
        data = step(data);
        version++;
      }

      // May still be behind currentVersion if a step was missing; the Zod schema strips the marker anyway.
      return { ...data, [VERSION_FIELD]: version };
    },
  };
}
