import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HarvardMobileTemplate from "@/components/resumes/mobile-templates/HarvardMobileTemplate";
import { emptyResumeData, type SectionKey } from "@/lib/resumeData";

// jsdom doesn't implement dnd-kit's pointer sensors' underlying APIs;
// Sortable-wrapped lists render fine, so no stub is needed here beyond what
// dnd-kit itself already tolerates in jsdom for a plain render (no drag).

const sectionOrder: SectionKey[] = [];
const noop = () => {};

describe("HarvardMobileTemplate — style lock", () => {
  it("never renders a photo upload control, even when visibleFields includes photo", () => {
    render(
      <HarvardMobileTemplate
        data={{
          ...emptyResumeData,
          name: "Jane Doe",
          photo: "data:image/png;base64,AAAA",
        }}
        onChange={noop}
        onWorkHistoryChange={noop}
        onEducationChange={noop}
        onSkillsChange={noop}
        onCertificationsChange={noop}
        onLanguagesChange={noop}
        onInterestsChange={noop}
        onLeadershipChange={vi.fn()}
        onHonorsChange={vi.fn()}
        sectionOrder={sectionOrder}
        onReorderSections={noop}
        visibleFields={["photo", "name"]}
        onReorderFields={noop}
        modernSectionZones={{}}
        onChangeModernSectionZones={noop}
        color={null}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/upload profile photo/i)).not.toBeInTheDocument();
  });

  it("always uses the Times New Roman font stack regardless of the color prop passed in", () => {
    const { container } = render(
      <HarvardMobileTemplate
        data={{ ...emptyResumeData, name: "Jane Doe" }}
        onChange={noop}
        onWorkHistoryChange={noop}
        onEducationChange={noop}
        onSkillsChange={noop}
        onCertificationsChange={noop}
        onLanguagesChange={noop}
        onInterestsChange={noop}
        onLeadershipChange={vi.fn()}
        onHonorsChange={vi.fn()}
        sectionOrder={sectionOrder}
        onReorderSections={noop}
        visibleFields={["name"]}
        onReorderFields={noop}
        modernSectionZones={{}}
        onChangeModernSectionZones={noop}
        color="#ff0000"
      />,
    );

    const root = container.querySelector(".resume-scalable") as HTMLElement;
    expect(root.style.fontFamily).toContain("Times New Roman");
  });
});
