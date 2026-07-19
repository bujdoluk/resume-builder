/**
 * Scrolls to whichever editor block is tagged `data-section-anchor="<anchor>"`
 * (see `CoverLetterFormFields.tsx`/`components/Sortable.tsx`'s `SortableBlock`
 * `anchor` prop) — shared by both builders' inline completion-steps
 * checklists and `Sidebar.tsx`'s copies of them (see
 * `AppState.resumeStepsSummary`/`coverLetterStepsSummary`), since all four
 * need to jump to the same on-page anchors regardless of which component
 * rendered the clicked step.
 *
 * `ResumeBuilder.tsx` always has both a mobile form and a desktop canvas
 * mounted at once (one hidden via a CSS breakpoint), so every step key has
 * two matching elements in the DOM — `offsetParent === null` is a cheap
 * "not display:none" check that picks out whichever one is actually
 * visible right now. `CoverLetterBuilder.tsx` only ever renders one tree,
 * so this is a no-op extra check there (its single match is always visible).
 */
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
