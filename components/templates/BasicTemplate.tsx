import { Fragment } from "react";
import {
  languageLevels,
  type ResumeData,
  type SectionKey,
} from "@/lib/resumeData";

export interface TemplateProps {
  data: ResumeData;
  sectionOrder: SectionKey[];
}

export default function BasicTemplate({ data, sectionOrder }: TemplateProps) {
  const fullName =
    [data.title, data.name].filter(Boolean).join(" ") || "Your Name";

  const workEntries = data.workHistory.filter(
    (entry) =>
      entry.position ||
      entry.location ||
      entry.jobDescription ||
      entry.dateFrom ||
      entry.dateTo,
  );

  const educationEntries = data.education.filter(
    (entry) =>
      entry.subject ||
      entry.location ||
      entry.description ||
      entry.dateFrom ||
      entry.dateTo,
  );

  const skillEntries = data.skills.filter((entry) => entry.value);
  const certificationEntries = data.certifications.filter(
    (entry) => entry.name || entry.date,
  );
  const languageEntries = data.languages.filter((entry) => entry.language);
  const interestEntries = data.interests.filter((entry) => entry.value);

  const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    workHistory: workEntries.length > 0 && (
      <>
        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <rect
              x="3"
              y="7.5"
              width="18"
              height="12"
              rx="1.5"
              strokeWidth="1.5"
            />
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

        <ul className="timeline timeline-vertical timeline-compact">
          {workEntries.map((entry, index) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <li key={entry.id}>
                {index > 0 && <hr />}
                <div className="timeline-start text-sm text-gray-500">
                  {dateRange}
                </div>
                <div className="timeline-middle">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    className="text-primary h-3 w-3 fill-current"
                  >
                    <circle cx="10" cy="10" r="6" />
                  </svg>
                </div>
                <div className="timeline-end timeline-box">
                  {entry.position && (
                    <p className="font-semibold">{entry.position}</p>
                  )}
                  {entry.location && (
                    <p className="text-sm text-gray-500">{entry.location}</p>
                  )}
                  {entry.jobDescription && (
                    <p className="mt-2 whitespace-pre-line text-gray-700">
                      {entry.jobDescription}
                    </p>
                  )}
                </div>
                {index < workEntries.length - 1 && <hr />}
              </li>
            );
          })}
        </ul>
      </>
    ),

    education: educationEntries.length > 0 && (
      <>
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

        <ul className="timeline timeline-vertical timeline-compact">
          {educationEntries.map((entry, index) => {
            const dateRange = [entry.dateFrom, entry.dateTo]
              .filter(Boolean)
              .join(" – ");

            return (
              <li key={entry.id}>
                {index > 0 && <hr />}
                <div className="timeline-start text-sm text-gray-500">
                  {dateRange}
                </div>
                <div className="timeline-middle">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    className="text-primary h-3 w-3 fill-current"
                  >
                    <circle cx="10" cy="10" r="6" />
                  </svg>
                </div>
                <div className="timeline-end timeline-box">
                  {entry.subject && (
                    <p className="font-semibold">{entry.subject}</p>
                  )}
                  {entry.location && (
                    <p className="text-sm text-gray-500">{entry.location}</p>
                  )}
                  {entry.description && (
                    <p className="mt-2 whitespace-pre-line text-gray-700">
                      {entry.description}
                    </p>
                  )}
                </div>
                {index < educationEntries.length - 1 && <hr />}
              </li>
            );
          })}
        </ul>
      </>
    ),

    skills: skillEntries.length > 0 && (
      <>
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

        <p className="text-gray-700">
          {skillEntries.map((entry) => entry.value).join(", ")}
        </p>
      </>
    ),

    certifications: certificationEntries.length > 0 && (
      <>
        <h2 className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-current"
          >
            <circle cx="12" cy="8" r="5" strokeWidth="1.5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="m8.5 12.5-1.5 7 5-3 5 3-1.5-7"
            />
          </svg>
          Certifications
        </h2>

        <div className="space-y-1">
          {certificationEntries.map((entry) => (
            <p key={entry.id} className="text-gray-700">
              <span className="font-semibold">{entry.name}</span>
              {entry.date && (
                <span className="text-sm text-gray-500"> · {entry.date}</span>
              )}
            </p>
          ))}
        </div>
      </>
    ),

    languages: languageEntries.length > 0 && (
      <>
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

        <div className="space-y-1">
          {languageEntries.map((entry) => {
            const levelIndex = languageLevels.indexOf(entry.level);

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 text-gray-700"
              >
                <span className="font-semibold">{entry.language}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{entry.level}</span>
                  <div className="rating rating-sm pointer-events-none">
                    {languageLevels.map((level, index) => (
                      <input
                        key={level}
                        type="radio"
                        aria-label={level}
                        className="mask mask-star"
                        defaultChecked={index === levelIndex}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    ),

    interests: interestEntries.length > 0 && (
      <>
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

        <p className="text-gray-700">
          {interestEntries.map((entry) => entry.value).join(", ")}
        </p>
      </>
    ),
  };

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none">
      <div className="p-8">
        <div className="flex items-center gap-4">
          {data.photo && (
            <div className="avatar">
              <div className="w-16 rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not an optimizable static asset */}
                <img
                  src={data.photo}
                  alt="Profile photo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{fullName}</h1>
            {data.jobTitle && (
              <p className="text-lg text-gray-600">{data.jobTitle}</p>
            )}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {data.address && (
            <p>
              <span className="font-semibold text-gray-700">Address: </span>
              {data.address}
            </p>
          )}
          {data.phone && (
            <p>
              <span className="font-semibold text-gray-700">Phone: </span>
              {data.phone}
            </p>
          )}
          {data.email && (
            <p>
              <span className="font-semibold text-gray-700">Email: </span>
              {data.email}
            </p>
          )}
          {data.website && (
            <p>
              <span className="font-semibold text-gray-700">Web: </span>
              {data.website}
            </p>
          )}
        </div>

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}
