import { Font, pdf } from "@react-pdf/renderer";
import { beforeAll, describe, expect, it } from "vitest";
import { emptyCoverLetterData, type CoverLetterData } from "@/lib/coverLetterData";
import { coverLetterPdfTemplates } from "@/lib/pdf/coverLetterTemplates";
import { pdfTemplates } from "@/lib/pdf/templates";
import { emptyResumeData, type ResumeData, type SectionKey } from "@/lib/resumeData";
import { defaultCoverLetterSectionOrder } from "@/lib/coverLetterSections";

// Every PDF template defaults to the "inter" family when no font is passed
// (see components/pdf/*PdfTemplate.tsx: `font ?? "inter"`), and @react-pdf
// throws if a referenced family was never registered. Production registers
// real webfonts from a remote CDN (lib/pdf/fonts.ts) — that's unnecessary
// network I/O for a smoke test, so alias "inter" to a built-in PDF font
// instead (@react-pdf/font resolves standard PDF font names synchronously,
// with no network access).
beforeAll(() => {
  Font.register({
    family: "inter",
    fonts: [
      { src: "Helvetica", fontWeight: "normal" },
      { src: "Helvetica-Bold", fontWeight: "bold" },
    ],
  });
});

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function expectValidPdf(buffer: Buffer) {
  expect(buffer.length).toBeGreaterThan(500);
  expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
}

const sectionOrder: SectionKey[] = [
  "workExperience",
  "education",
  "skills",
  "certifications",
  "languages",
  "interests",
  "customFields",
];

const resumeData: ResumeData = {
  ...emptyResumeData,
  name: "Jane Doe",
  jobTitle: "Senior Frontend Engineer",
  email: "jane.doe@example.com",
  aboutMe: "Frontend engineer with 8 years of experience.",
  workExperience: [
    {
      id: "w1",
      position: "Senior Frontend Engineer",
      dateFrom: "06-2020",
      dateTo: "Present",
      location: "Remote",
      jobDescription: "Led the migration to a component-driven design system.",
    },
  ],
  education: [
    {
      id: "e1",
      school: "State University",
      subject: "Computer Science",
      location: "Springfield",
      description: "Graduated with honours.",
      dateFrom: "09-2016",
      dateTo: "06-2020",
    },
  ],
  skills: [{ id: "s1", value: "TypeScript" }],
  languages: [{ id: "l1", language: "English", level: "Advanced" }],
  interests: [{ id: "i1", value: "Rock climbing" }],
};

const coverLetterData: CoverLetterData = {
  ...emptyCoverLetterData,
  senderName: "Jane Doe",
  senderEmail: "jane.doe@example.com",
  recipientName: "Alex Recruiter",
  subject: "Application for Senior Frontend Engineer",
  greeting: "Dear Alex,",
  body: "I would love to bring my experience to your team.",
  closing: "Best regards,",
};

describe("resume PDF templates", () => {
  it.each(Object.entries(pdfTemplates))("%s renders a valid PDF", async (_id, Template) => {
    const stream = await pdf(<Template data={resumeData} sectionOrder={sectionOrder} />).toBuffer();
    const buffer = await streamToBuffer(stream);

    expectValidPdf(buffer);
  });
});

describe("cover letter PDF templates", () => {
  it.each(Object.entries(coverLetterPdfTemplates))("%s renders a valid PDF", async (_id, Template) => {
    const stream = await pdf(
      <Template data={coverLetterData} sectionOrder={defaultCoverLetterSectionOrder} />,
    ).toBuffer();
    const buffer = await streamToBuffer(stream);

    expectValidPdf(buffer);
  });
});
