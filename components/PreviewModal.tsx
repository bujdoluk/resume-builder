"use client";

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
