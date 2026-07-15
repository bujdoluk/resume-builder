"use client";

/**
 * Generic full-page Preview modal opened from an editor's "Preview" button —
 * renders whatever `templateComponent` and `templateProps` the caller
 * supplies, scaled to fit the viewport on mobile widths via
 * `ScaleToFitWidth`. Also renders a second, always-mounted copy of the
 * template (`#pdf-area`) that's hidden on screen and only shown under
 * `@media print` (app/globals.css), so the Print button can call
 * `window.print()` without the dialog ever popping open. Exposed via a ref
 * handle (`open()`/`print()`), mirroring `ConfirmDialog`/`SaveResumeDialog`.
 *
 * Reused by both the resume editor (`templateComponent` looked up from
 * `templates`, since it has several swappable templates) and the cover
 * letter builder (which has only one template and just passes it directly)
 * — the generic type parameter lets each caller's own props shape
 * (`TemplateProps` vs `CoverLetterTemplateProps`) flow through untouched.
 */
import {
  useImperativeHandle,
  useRef,
  type ComponentType,
  type Ref,
} from "react";
import ScaleToFitWidth from "@/components/ScaleToFitWidth";

export interface PreviewModalHandle {
  open: () => void;
  print: () => void;
}

export interface PreviewModalProps<T extends object> {
  ref?: Ref<PreviewModalHandle>;
  templateComponent: ComponentType<T>;
  templateProps: T;
}

export default function PreviewModal<T extends object>({
  ref,
  templateComponent: TemplateComponent,
  templateProps,
}: PreviewModalProps<T>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    print: () => window.print(),
  }));

  return (
    <>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box max-h-[90vh]! w-[95vw]! max-w-[95vw]! overflow-auto! rounded-none! rounded-tr-2xl! rounded-br-2xl! bg-transparent! p-0! shadow-none! lg:w-fit! lg:max-w-none!">
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
