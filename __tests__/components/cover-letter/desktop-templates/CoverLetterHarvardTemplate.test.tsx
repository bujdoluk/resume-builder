import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CoverLetterHarvardTemplate from "@/components/cover-letter/desktop-templates/CoverLetterHarvardTemplate";
import { emptyCoverLetterData } from "@/lib/coverLetterData";

describe("CoverLetterHarvardTemplate — style lock", () => {
  it("ignores the color prop entirely", () => {
    render(
      <CoverLetterHarvardTemplate
        data={{ ...emptyCoverLetterData, senderName: "Jane Doe", subject: "Application" }}
        color="#ff0000"
      />,
    );

    const subject = screen.getByText("Application");
    expect(subject).not.toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("always uses the Times New Roman font stack regardless of the font prop", () => {
    const { container } = render(
      <CoverLetterHarvardTemplate
        data={{ ...emptyCoverLetterData, senderName: "Jane Doe" }}
        font="playfair"
      />,
    );

    const root = container.querySelector(".resume-scalable") as HTMLElement;
    expect(root.style.fontFamily).toContain("Times New Roman");
    expect(root.getAttribute("style") ?? "").not.toContain("playfair");
  });
});
