"use client";

/**
 * Shrinks its fixed-width child (an A4-sized template) down via CSS
 * transform so it fits the viewport on narrow (mobile) screens, instead of
 * overflowing and relying on horizontal scroll — used by the Preview
 * modal, whose `modal-box` is capped at `w-[95vw]` below Tailwind's `lg`
 * breakpoint but switches to `w-fit` (sizes itself to the content, no cap)
 * at `lg` and up.
 *
 * Deliberately keys off `window.innerWidth`, not this component's own
 * container's measured width: the container is self-referential here —
 * at `lg`+ the modal's own width is *itself* determined by this
 * component's rendered size (`w-fit`). Measuring "available width" from a
 * container whose size we're also the one setting means that once we'd
 * shrunk for mobile, the container itself would report that shrunk width
 * back, computing a small scale forever and never growing back on resize
 * to desktop. `window.innerWidth` has no such feedback loop. The child's
 * own natural width is still measured from the DOM (via a plain
 * `inline-block` wrapper, unaffected by any already-applied transform),
 * since that measurement isn't self-referential — it reflects the
 * template's fixed A4 width regardless of anything this component does.
 */
import { useEffect, useRef, useState } from "react";

const LG_BREAKPOINT_PX = 1024;
// Matches the Preview modal's own `w-[95vw]` class (see components/resumes/ResumeBuilder.tsx).
const MODAL_WIDTH_RATIO = 0.95;

export default function ScaleToFitWidth({
  children,
}: {
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{
    scale: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    function recalc() {
      const naturalWidth = inner!.offsetWidth;
      const naturalHeight = inner!.offsetHeight;
      if (naturalWidth === 0) return;
      const availableWidth =
        window.innerWidth >= LG_BREAKPOINT_PX
          ? Infinity
          : window.innerWidth * MODAL_WIDTH_RATIO;
      setState({
        scale: Math.min(1, availableWidth / naturalWidth),
        width: naturalWidth,
        height: naturalHeight,
      });
    }

    recalc();
    // Covers the child's own size changing (e.g. data/font updates);
    // window "resize" (below) covers the viewport/breakpoint changing.
    const observer = new ResizeObserver(recalc);
    observer.observe(inner);
    window.addEventListener("resize", recalc);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, []);

  const isShrunk = state !== null && state.scale < 1;

  return (
    <div
      style={
        isShrunk
          ? {
              width: state!.width * state!.scale,
              height: state!.height * state!.scale,
              overflow: "hidden",
            }
          : undefined
      }
    >
      <div
        ref={innerRef}
        className="origin-top-left inline-block"
        style={isShrunk ? { transform: `scale(${state!.scale})` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
