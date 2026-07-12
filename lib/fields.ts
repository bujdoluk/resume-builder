/**
 * The set of personal-info fields every resume template can show/hide and
 * reorder (photo, name, job title, contact fields, about me), plus their
 * display labels.
 */
export type FieldKey =
  | "photo"
  | "name"
  | "jobTitle"
  | "phone"
  | "email"
  | "address"
  | "website"
  | "linkedin"
  | "aboutMe";

export const allFields: FieldKey[] = [
  "photo",
  "name",
  "jobTitle",
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
  "aboutMe",
];

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
