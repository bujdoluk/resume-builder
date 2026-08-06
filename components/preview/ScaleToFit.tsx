"use client";

import { useEffect, useRef, useState } from "react";

const LG_BREAKPOINT_PX = 1024;

const MODAL_WIDTH_RATIO = 0.95;
const MODAL_HEIGHT_RATIO = 0.9;

// A4 page height in CSS px at 96dpi (1mm = 96/25.4px). Every resume/cover
// letter template renders at min-h-[297mm] (see
// components/resumes/desktop-templates/*.tsx and
// components/cover-letter/desktop-templates/*.tsx), so this is what "one
// page" means regardless of a given document's actual (possibly multi-page)
// content height. Scaling against this fixed reference — rather than the
// document's full natural height — lets a single-page document shrink to
// fit the modal with no scrollbar, while a longer document still overflows
// past one page's worth of space and scrolls instead of shrinking further.
const A4_PAGE_HEIGHT_PX = 297 * (96 / 25.4);

export default function ScaleToFit({
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
      const availableHeight = window.innerHeight * MODAL_HEIGHT_RATIO;
      setState({
        scale: Math.min(1, availableWidth / naturalWidth, availableHeight / A4_PAGE_HEIGHT_PX),
        width: naturalWidth,
        height: naturalHeight,
      });
    }

    recalc();

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
