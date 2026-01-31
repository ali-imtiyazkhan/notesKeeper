"use client"

import * as React from "react";
import { Moon, Sun } from "lucide-react";

function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeInit() {
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark") applyTheme("dark");
    } catch { }
  }, []);
  return null;
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next ? "dark" : "light");
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle theme"
      aria-label="Toggle theme"
      className="fixed bottom-4 right-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/90 shadow-md backdrop-blur hover:bg-muted cursor-pointer"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}


