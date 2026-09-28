"use client";

import { useImperativeHandle, useRef, type ComponentType, type Ref } from "react";
import { createPortal } from "react-dom";
import ScaleToFit from "@/components/preview/ScaleToFit";
import { useHasMounted } from "@/components/useHasMounted";

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
  // Portaled onto body so the print stylesheet can hide every other body child. Gated on mount since body doesn't exist during SSR.
  const mounted = useHasMounted();

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    print: () => window.print(),
  }));

  return (
    <>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box max-h-[90vh]! w-[95vw]! max-w-[95vw]! overflow-auto! rounded-none! bg-transparent! p-0! shadow-none! lg:w-fit! lg:max-w-none!">
          <ScaleToFit>
            <TemplateComponent {...templateProps} />
          </ScaleToFit>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {mounted &&
        createPortal(
          <div id="pdf-area" className="hidden print:block">
            <TemplateComponent {...templateProps} />
          </div>,
          document.body,
        )}
    </>
  );
}
