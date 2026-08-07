
import { z } from "zod";

const FIELD_KEYS = [
  "photo",
  "name",
  "jobTitle",
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
  "aboutMe",
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];
export const fieldKeySchema = z.enum(FIELD_KEYS);

// Drops individually-invalid entries rather than discarding the whole list —
// one corrupted field key shouldn't hide every other still-valid one.
export const visibleFieldsSchema: z.ZodType<FieldKey[]> = z
  .array(z.unknown())
  .catch([])
  .transform((items) => items.filter((item): item is FieldKey => fieldKeySchema.safeParse(item).success));

export const allFields: FieldKey[] = [...FIELD_KEYS];

export const fieldLabels: Record<FieldKey, string> = {
  photo: "Photo",
  name: "Name",
  jobTitle: "Job Title",
  phone: "Phone",
  email: "Email",
  address: "Address",
  website: "Website",
  linkedin: "LinkedIn",
  aboutMe: "About Me",
};
