export type ThemeMode = "dark" | "light";

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem("pulse_theme_mode");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark"; // Default to dark mode
}

export function applyTheme(mode: ThemeMode) {
  try {
    localStorage.setItem("pulse_theme_mode", mode);
    const root = document.documentElement;

    if (mode === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }

    window.dispatchEvent(new Event("pulse_theme_changed"));
  } catch (e) {
    console.error("Failed to apply theme", e);
  }
}

export function initTheme() {
  const mode = getStoredTheme();
  applyTheme(mode);
}
