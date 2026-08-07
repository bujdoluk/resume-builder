// Shared scaffold for versioning a JSONB blob's stored shape (resume/cover
// letter `data`, see lib/resumeData.ts / lib/coverLetterData.ts). Postgres
// doesn't know or enforce the shape of a jsonb column, so once a document
// has been written it's frozen in whatever shape it had at write time —
// this is what lets a later breaking change to that shape still read older
// rows correctly, by upgrading them step by step before validation.

export type MigrationStep = (data: Record<string, unknown>) => Record<string, unknown>;

const VERSION_FIELD = "__schemaVersion";

export interface VersionedCodec<T> {
  /** Stamps the current schema version onto a value about to be persisted. */
  stamp: (data: T) => Record<string, unknown>;
  /**
   * Runs any pending migration steps against raw, untrusted storage input,
   * returning pre-validation data — still needs to be run through the
   * corresponding Zod schema (which also strips the version marker, since
   * it isn't part of the schema).
   */
  migrate: (raw: unknown) => Record<string, unknown>;
}

/**
 * @param currentVersion bump this whenever a breaking change is made to the
 *   stored shape, and add the corresponding upgrade step to `migrations`.
 * @param migrations keyed by the version being upgraded FROM (e.g. key `1`
 *   upgrades a v1 document to v2). Never mutate or remove an entry once it
 *   has shipped — older rows may still need it. A missing step for the
 *   current gap is not an error; `migrate` just stops there and leaves the
 *   rest to the schema's own per-field defaults/catches as a safety net.
 */
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

      // Reflects whatever version the data actually settled at — still
      // behind `currentVersion` if a step was missing and the loop broke
      // early. Harmless either way: the caller always pipes this through a
      // Zod schema next, which strips the marker since it isn't a real field.
      return { ...data, [VERSION_FIELD]: version };
    },
  };
}
