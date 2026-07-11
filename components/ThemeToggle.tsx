"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/Icons";

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Server-rendered markup always defaults to light (no way to know the
  // visitor's saved/system preference ahead of time) — this effect corrects
  // it once on mount. That first-paint flash is the accepted tradeoff for
  // avoiding a hydration mismatch, which is why the state read happens here
  // instead of in a lazy useState initializer.
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const dark = event.target.checked;
    setIsDark(dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
    applyTheme(dark);
  }

  return (
    <label
      className="swap swap-rotate btn btn-ghost btn-circle"
      aria-label="Toggle dark mode"
    >
      <input
        type="checkbox"
        className="theme-controller"
        value="dark"
        checked={isDark}
        onChange={handleChange}
      />
      <SunIcon className="swap-off h-5 w-5 stroke-current" />
      <MoonIcon className="swap-on h-5 w-5 stroke-current" />
    </label>
  );
}
