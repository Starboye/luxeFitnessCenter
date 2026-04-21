"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "luxe-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState("red");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) || "red";
    setTheme(saved);
    document.documentElement.dataset.theme = saved === "gold" ? "gold" : "red";
  }, []);

  function toggleTheme() {
    const next = theme === "red" ? "gold" : "red";
    setTheme(next);
    document.documentElement.dataset.theme = next === "gold" ? "gold" : "red";
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme}>
      Accent: {theme === "red" ? "Red" : "Gold"}
    </button>
  );
}
