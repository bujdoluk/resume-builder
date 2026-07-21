
export function scrollToSectionAnchor(anchor: string) {
  const matches = document.querySelectorAll<HTMLElement>(
    `[data-section-anchor="${anchor}"]`,
  );
  for (const element of matches) {
    if (element.offsetParent !== null) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
}
