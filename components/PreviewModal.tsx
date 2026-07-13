"use client";

/**
 * Full-page resume Preview modal opened from the editor's "Preview" button —
 * renders the current template's read-only desktop component, scaled to fit
 * the viewport on mobile widths via `ScaleToFitWidth`. Also renders a second,
 * always-mounted copy of the template (`#pdf-area`) that's hidden on screen
 * and only shown under `@media print` (app/globals.css), so the Print button
 * can call `window.print()` without the dialog ever popping open. Exposed
 * via a ref handle (`open()`/`print()`), mirroring
 * `ConfirmDialog`/`SaveResumeDialog`.
 */
import { useImperativeHandle, useRef, type ComponentType, type Ref } from "react";
import ScaleToFitWidth from "@/components/ScaleToFitWidth";
import type { TemplateProps } from "@/lib/templates";

export interface PreviewModalHandle {
  open: () => void;
  print: () => void;
}

export default function PreviewModal({
  ref,
  templateComponent: TemplateComponent,
  ...templateProps
}: {
  ref?: Ref<PreviewModalHandle>;
  templateComponent: ComponentType<TemplateProps>;
} & TemplateProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    print: () => window.print(),
  }));

  return (
    <>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box max-h-[90vh]! w-[95vw]! max-w-[95vw]! overflow-auto! bg-transparent! p-0! shadow-none! lg:w-fit! lg:max-w-none!">
          <ScaleToFitWidth>
            <TemplateComponent {...templateProps} />
          </ScaleToFitWidth>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <div id="pdf-area" className="hidden print:block">
        <TemplateComponent {...templateProps} />
      </div>
    </>
  );
}
