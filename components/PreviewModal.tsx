"use client";

/**
 * Full-page resume Preview modal opened from the editor's "Preview" button —
 * renders the current template's read-only desktop component, scaled to fit
 * the viewport on mobile widths via `ScaleToFitWidth`. Exposed via a ref
 * handle (`open()`), mirroring `ConfirmDialog`/`SaveResumeDialog`.
 */
import { useImperativeHandle, useRef, type ComponentType, type Ref } from "react";
import ScaleToFitWidth from "@/components/ScaleToFitWidth";
import type { TemplateProps } from "@/lib/templates";

export interface PreviewModalHandle {
  open: () => void;
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
  }));

  return (
    <dialog ref={dialogRef} className="modal">
      <div
        id="pdf-area"
        className="modal-box max-h-[90vh]! w-[95vw]! max-w-[95vw]! overflow-auto! bg-transparent! p-0! shadow-none! lg:w-fit! lg:max-w-none!"
      >
        <ScaleToFitWidth>
          <TemplateComponent {...templateProps} />
        </ScaleToFitWidth>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
