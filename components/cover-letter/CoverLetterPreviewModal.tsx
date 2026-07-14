"use client";

/**
 * Full-page cover letter Preview modal — the cover letter counterpart of
 * `components/PreviewModal.tsx` (same structure: an on-screen dialog plus a
 * second, always-mounted `#pdf-area` copy shown only under `@media print`).
 * Exposes the same `PreviewModalHandle` shape (imported, not redeclared) so
 * the existing `PrintButton` component works here unchanged.
 */
import { useImperativeHandle, useRef, type Ref } from "react";
import ScaleToFitWidth from "@/components/ScaleToFitWidth";
import type { PreviewModalHandle } from "@/components/PreviewModal";
import CoverLetterBasicTemplate, {
  type CoverLetterTemplateProps,
} from "@/components/cover-letter/CoverLetterBasicTemplate";

export type { PreviewModalHandle };

export default function CoverLetterPreviewModal({
  ref,
  ...templateProps
}: {
  ref?: Ref<PreviewModalHandle>;
} & CoverLetterTemplateProps) {
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
            <CoverLetterBasicTemplate {...templateProps} />
          </ScaleToFitWidth>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <div id="pdf-area" className="hidden print:block">
        <CoverLetterBasicTemplate {...templateProps} />
      </div>
    </>
  );
}
