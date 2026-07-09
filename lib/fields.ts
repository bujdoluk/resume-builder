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
