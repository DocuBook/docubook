const buttons = document.querySelectorAll<HTMLButtonElement>("[data-theme-value]");

function syncThemeButtons() {
  const dark = document.documentElement.classList.contains("dark");
  for (const button of buttons) {
    button.setAttribute("aria-checked", String((button.dataset.themeValue === "dark") === dark));
  }
}

for (const button of buttons) {
  button.addEventListener("click", () => {
    const theme = button.dataset.themeValue === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Storage may be blocked; current-page theme still works.
    }
    syncThemeButtons();
  });
}

syncThemeButtons();
