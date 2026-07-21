"use client";

import { useLayoutEffect, useRef } from "react";

type AutoResizeTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function AutoResizeTextarea({
  style,
  ...props
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  });

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      style={{ ...style, overflow: "hidden", resize: "none", minHeight: 0 }}
    />
  );
}
