"use client";

import { useImperativeHandle, useRef, type ComponentType, type Ref } from "react";
import { createPortal } from "react-dom";
import ScaleToFit from "@/components/ScaleToFit";
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
  // #pdf-area is portaled straight onto <body> (see below) so the print
  // stylesheet can `display: none` every other body child wholesale — it
  // can't do that while this div is nested arbitrarily deep in the app
  // shell alongside everything else. document.body doesn't exist during
  // SSR, so the portal is gated on mount.
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
