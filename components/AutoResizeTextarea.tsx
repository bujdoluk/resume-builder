"use client";

/**
 * A <textarea> that grows/shrinks to exactly fit its content — one line of
 * text gets a one-line-tall box, four lines gets a four-line-tall box, so
 * there's never an internal scrollbar. Recalculates on every render (not
 * just when `value` changes) since font-size changes elsewhere in the app
 * (the sidebar's Font Size control) resize the text without necessarily
 * changing this component's own props. daisyUI's `.textarea` class hardcodes
 * `min-height: 5rem`, which would otherwise stop short content (1-2 lines)
 * from ever shrinking below that — overridden here via inline style, which
 * always wins over the class.
 */
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
