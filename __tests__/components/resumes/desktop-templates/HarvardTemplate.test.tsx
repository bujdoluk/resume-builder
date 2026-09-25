import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HarvardTemplate from "@/components/resumes/desktop-templates/HarvardTemplate";
import { emptyResumeData, type SectionKey } from "@/lib/resumeData";

const sectionOrder: SectionKey[] = [];

describe("HarvardTemplate — style lock", () => {
  it("ignores the color prop entirely", () => {
    const { container } = render(
      <HarvardTemplate
        data={{ ...emptyResumeData, name: "Jane Doe" }}
        sectionOrder={sectionOrder}
        color="#ff0000"
      />,
    );

    const root = container.querySelector(".resume-scalable");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("style") ?? "").not.toContain("ff0000");
    // No descendant should carry the accent color as an inline style either.
    container.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
      expect(el.style.color).not.toBe("rgb(255, 0, 0)");
      expect(el.style.borderColor).not.toBe("rgb(255, 0, 0)");
    });
  });

  it("ignores the font prop and always uses the Times New Roman stack", () => {
    const { container } = render(
      <HarvardTemplate
        data={{ ...emptyResumeData, name: "Jane Doe" }}
        sectionOrder={sectionOrder}
        font="playfair"
      />,
    );

    const root = container.querySelector(".resume-scalable");
    expect(root?.getAttribute("style") ?? "").not.toContain("playfair");
    expect((root as HTMLElement).style.fontFamily).toContain("Times New Roman");
  });

  it("never renders a photo, even when visibleFields includes it and data.photo is set", () => {
    render(
      <HarvardTemplate
        data={{
          ...emptyResumeData,
          name: "Jane Doe",
          photo: "data:image/png;base64,AAAA",
        }}
        sectionOrder={sectionOrder}
        visibleFields={["photo", "name"]}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("HarvardTemplate — Harvard-only bonus sections", () => {
  it("renders Leadership Experience and Honors & Awards after the regular sections, only when filled", () => {
    render(
      <HarvardTemplate
        data={{
          ...emptyResumeData,
          name: "Jane Doe",
          leadershipExperience: [
            {
              id: "l1",
              position: "Club President",
              dateFrom: "2020",
              dateTo: "2021",
              location: "",
              jobDescription: "",
            },
          ],
          honorsAwards: [
            { id: "h1", name: "Dean's List", issuer: "State University", dateFrom: "2021", dateTo: "" },
          ],
        }}
        sectionOrder={sectionOrder}
      />,
    );

    expect(screen.getByText("Club President")).toBeInTheDocument();
    expect(screen.getByText("Dean's List")).toBeInTheDocument();
  });

  it("hides the bonus sections entirely when they have no filled entries", () => {
    render(
      <HarvardTemplate
        data={{ ...emptyResumeData, name: "Jane Doe" }}
        sectionOrder={sectionOrder}
      />,
    );

    expect(screen.queryByText("Leadership Experience")).not.toBeInTheDocument();
    expect(screen.queryByText("Honors & Awards")).not.toBeInTheDocument();
  });
});
