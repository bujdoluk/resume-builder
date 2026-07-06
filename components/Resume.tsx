"use client";

export interface LanguageEntry {
  id: string;
  language: string;
  level: string;
}

export const languageLevels = [
  "Beginner",
  "Advanced",
  "Full Professional Proficiency",
  "Native Speaker",
];

export interface ResumeData {
  title: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  phoneNumber: string;
  email: string;
  city: string;
  street: string;
  country: string;
  zipCode: string;
  website: string;
  position: string;
  dateFrom: string;
  dateTo: string;
  location: string;
  jobDescription: string;
  eduSubject: string;
  eduLocation: string;
  eduDescription: string;
  eduDateFrom: string;
  eduDateTo: string;
  skills: string;
  languages: LanguageEntry[];
  interests: string;
}

export const emptyResumeData: ResumeData = {
  title: "",
  firstName: "",
  lastName: "",
  jobTitle: "",
  phoneNumber: "",
  email: "",
  city: "",
  street: "",
  country: "",
  zipCode: "",
  website: "",
  position: "",
  dateFrom: "",
  dateTo: "",
  location: "",
  jobDescription: "",
  eduSubject: "",
  eduLocation: "",
  eduDescription: "",
  eduDateFrom: "",
  eduDateTo: "",
  skills: "",
  languages: [],
  interests: "",
};

interface ResumeProps {
  data: ResumeData;
  onChange: (field: keyof ResumeData, value: string) => void;
  onLanguagesChange: (languages: LanguageEntry[]) => void;
}

export default function Resume({
  data,
  onChange,
  onLanguagesChange,
}: ResumeProps) {
  function addLanguage() {
    onLanguagesChange([
      ...data.languages,
      { id: crypto.randomUUID(), language: "", level: languageLevels[0] },
    ]);
  }

  function updateLanguage(
    id: string,
    field: "language" | "level",
    value: string,
  ) {
    onLanguagesChange(
      data.languages.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeLanguage(id: string) {
    onLanguagesChange(data.languages.filter((entry) => entry.id !== id));
  }

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none">
      <div className="p-8">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <circle cx="12" cy="8" r="3.5" strokeWidth="1.5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4.5 19.5a7.5 7.5 0 0 1 15 0"
            />
          </svg>
          Personal Information
        </h2>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex gap-2">
            <fieldset className="fieldset w-24">
              <legend className="fieldset-legend">Title</legend>
              <input
                type="text"
                name="title"
                placeholder="Mr."
                className="input w-full"
                value={data.title}
                onChange={(e) => onChange("title", e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">Name</legend>
              <input
                type="text"
                name="firstName"
                placeholder="John"
                className="input w-full"
                value={data.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
              />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Surname</legend>
            <input
              type="text"
              name="lastName"
              placeholder="Doe"
              className="input w-full"
              value={data.lastName}
              onChange={(e) => onChange("lastName", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset col-span-2">
            <legend className="fieldset-legend">Job Title</legend>
            <input
              type="text"
              name="jobTitle"
              placeholder="Software Engineer"
              className="input w-full"
              value={data.jobTitle}
              onChange={(e) => onChange("jobTitle", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Phone Number</legend>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="+1 555 123 4567"
              className="input w-full"
              value={data.phoneNumber}
              onChange={(e) => onChange("phoneNumber", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input
              type="email"
              name="email"
              placeholder="john.doe@example.com"
              className="input w-full"
              value={data.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">City</legend>
            <input
              type="text"
              name="city"
              placeholder="New York"
              className="input w-full"
              value={data.city}
              onChange={(e) => onChange("city", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Street</legend>
            <input
              type="text"
              name="street"
              placeholder="123 Main St"
              className="input w-full"
              value={data.street}
              onChange={(e) => onChange("street", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Country</legend>
            <input
              type="text"
              name="country"
              placeholder="United States"
              className="input w-full"
              value={data.country}
              onChange={(e) => onChange("country", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Zip Code</legend>
            <input
              type="text"
              name="zipCode"
              placeholder="10001"
              className="input w-full"
              value={data.zipCode}
              onChange={(e) => onChange("zipCode", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset col-span-2">
            <legend className="fieldset-legend">Web</legend>
            <input
              type="text"
              name="website"
              placeholder="johndoe.com"
              className="input w-full"
              value={data.website}
              onChange={(e) => onChange("website", e.target.value)}
            />
          </fieldset>
        </div>

        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <rect x="3" y="7.5" width="18" height="12" rx="1.5" strokeWidth="1.5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M3 12.75h18"
            />
          </svg>
          Work History
        </h2>

        <div className="flex flex-col gap-2">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Position</legend>
            <input
              type="text"
              name="position"
              placeholder="Senior Software Engineer at Acme Inc."
              className="input w-full"
              value={data.position}
              onChange={(e) => onChange("position", e.target.value)}
            />
          </fieldset>

          <div className="flex gap-2">
            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">From</legend>
              <input
                type="text"
                name="dateFrom"
                placeholder="01-06-2020"
                className="input w-full"
                value={data.dateFrom}
                onChange={(e) => onChange("dateFrom", e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">To</legend>
              <input
                type="text"
                name="dateTo"
                placeholder="09-12-2022 or Present"
                className="input w-full"
                value={data.dateTo}
                onChange={(e) => onChange("dateTo", e.target.value)}
              />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Location</legend>
            <input
              type="text"
              name="location"
              placeholder="New York, NY"
              className="input w-full"
              value={data.location}
              onChange={(e) => onChange("location", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Job Description</legend>
            <textarea
              name="jobDescription"
              placeholder="Describe your responsibilities and achievements..."
              className="textarea w-full"
              rows={5}
              value={data.jobDescription}
              onChange={(e) => onChange("jobDescription", e.target.value)}
            />
          </fieldset>
        </div>

        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="m2.25 9 9.75-4.5L21.75 9l-9.75 4.5L2.25 9Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M6 11.25v4.5c0 .621 2.686 2.25 6 2.25s6-1.629 6-2.25v-4.5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M21.75 9v6"
            />
          </svg>
          Education
        </h2>

        <div className="flex flex-col gap-2">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Subject of Study</legend>
            <input
              type="text"
              name="eduSubject"
              placeholder="Computer Science"
              className="input w-full"
              value={data.eduSubject}
              onChange={(e) => onChange("eduSubject", e.target.value)}
            />
          </fieldset>

          <div className="flex gap-2">
            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">From</legend>
              <input
                type="text"
                name="eduDateFrom"
                placeholder="01-09-2016"
                className="input w-full"
                value={data.eduDateFrom}
                onChange={(e) => onChange("eduDateFrom", e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">To</legend>
              <input
                type="text"
                name="eduDateTo"
                placeholder="30-06-2020"
                className="input w-full"
                value={data.eduDateTo}
                onChange={(e) => onChange("eduDateTo", e.target.value)}
              />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Location</legend>
            <input
              type="text"
              name="eduLocation"
              placeholder="New York, NY"
              className="input w-full"
              value={data.eduLocation}
              onChange={(e) => onChange("eduLocation", e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              name="eduDescription"
              placeholder="Describe your studies, thesis, honors..."
              className="textarea w-full"
              rows={5}
              value={data.eduDescription}
              onChange={(e) => onChange("eduDescription", e.target.value)}
            />
          </fieldset>
        </div>

        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="m11.48 3.499 2.078 4.5 4.94.719c1.02.148 1.427 1.408.69 2.125l-3.573 3.482.843 4.92c.174 1.016-.9 1.79-1.816 1.31L12 18.354l-4.421 2.326c-.916.48-1.99-.294-1.816-1.31l.843-4.92-3.573-3.482c-.737-.717-.33-1.977.69-2.125l4.94-.719 2.078-4.5c.457-.99 1.902-.99 2.36 0Z"
            />
          </svg>
          Skills
        </h2>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Skills</legend>
          <textarea
            name="skills"
            placeholder="JavaScript, TypeScript, React, Node.js, ..."
            className="textarea w-full"
            rows={4}
            value={data.skills}
            onChange={(e) => onChange("skills", e.target.value)}
          />
        </fieldset>

        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9s-1.25 6.5-3.75 9c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z"
            />
          </svg>
          Languages
        </h2>

        <div className="flex flex-col gap-2">
          {data.languages.map((entry) => (
            <div key={entry.id} className="flex items-end gap-2">
              <fieldset className="fieldset flex-1">
                <legend className="fieldset-legend">Language</legend>
                <input
                  type="text"
                  placeholder="English"
                  className="input w-full"
                  value={entry.language}
                  onChange={(e) =>
                    updateLanguage(entry.id, "language", e.target.value)
                  }
                />
              </fieldset>

              <fieldset className="fieldset w-64">
                <legend className="fieldset-legend">Level</legend>
                <select
                  className="select w-full"
                  value={entry.level}
                  onChange={(e) =>
                    updateLanguage(entry.id, "level", e.target.value)
                  }
                >
                  {languageLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </fieldset>

              <button
                type="button"
                aria-label="Remove language"
                className="btn btn-square btn-ghost btn-sm mb-1"
                onClick={() => removeLanguage(entry.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addLanguage}
          >
            + Add Language
          </button>
        </div>

        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 20.25c-.318 0-.633-.088-.906-.262C7.499 17.577 3 14.15 3 9.75 3 7.026 5.132 4.9 7.79 4.9c1.6 0 3.049.789 3.96 2.017a.7.7 0 0 0 .5.208.7.7 0 0 0 .5-.208A4.897 4.897 0 0 1 16.71 4.9C19.368 4.9 21.5 7.026 21.5 9.75c0 4.4-4.5 7.827-8.594 10.238-.273.174-.588.262-.906.262Z"
            />
          </svg>
          Interests
        </h2>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Interests</legend>
          <textarea
            name="interests"
            placeholder="Photography, Hiking, Chess, ..."
            className="textarea w-full"
            rows={4}
            value={data.interests}
            onChange={(e) => onChange("interests", e.target.value)}
          />
        </fieldset>
      </div>
    </div>
  );
}
