"use client";

import { useEffect, useRef, useState } from "react";

const LG_BREAKPOINT_PX = 1024;

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
