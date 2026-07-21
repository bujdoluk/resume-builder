
import type { ResumeData } from "@/lib/resumeData";

export const sampleResumeData: ResumeData = {
  photo: "",
  name: "Jane Doe",
  jobTitle: "Senior Product Designer",
  phone: "+1 555 123 4567",
  email: "jane.doe@example.com",
  address: "123 Main St, New York, 10001, United States",
  website: "janedoe.com",
  linkedin: "linkedin.com/in/janedoe",
  aboutMe:
    "Product designer with 8+ years of experience leading end-to-end design for consumer and B2B products, from research through shipping polished, accessible interfaces.",
  workExperience: [
    {
      id: "sample-work-1",
      position: "Senior Product Designer at Acme Inc.",
      dateFrom: "01-06-2021",
      dateTo: "Present",
      location: "New York, NY",
      jobDescription:
        "Led the design of the core product experience, mentored two junior designers, and partnered with engineering to ship a design system used across 12 teams.",
    },
    {
      id: "sample-work-2",
      position: "Product Designer at Northwind Co.",
      dateFrom: "01-03-2018",
      dateTo: "30-05-2021",
      location: "Boston, MA",
      jobDescription:
        "Designed and shipped the onboarding flow, improving activation rate by 18%.",
    },
  ],
  education: [
    {
      id: "sample-edu-1",
      school: "Parsons School of Design",
      subject: "B.A. in Graphic Design",
      dateFrom: "01-09-2013",
      dateTo: "30-06-2017",
      location: "New York, NY",
      description: "Graduated with honors. Senior thesis on accessible design systems.",
    },
  ],
  skills: [
    { id: "sample-skill-1", value: "Figma" },
    { id: "sample-skill-2", value: "Design Systems" },
    { id: "sample-skill-3", value: "User Research" },
    { id: "sample-skill-4", value: "Prototyping" },
  ],
  certifications: [
    {
      id: "sample-cert-1",
      name: "Certified UX Professional",
      dateFrom: "2022",
      dateTo: "",
    },
  ],
  languages: [
    { id: "sample-lang-1", language: "English", level: "Native Speaker" },
    {
      id: "sample-lang-2",
      language: "Spanish",
      level: "Full Professional Proficiency",
    },
  ],
  interests: [
    { id: "sample-interest-1", value: "Photography" },
    { id: "sample-interest-2", value: "Ceramics" },
  ],
};
