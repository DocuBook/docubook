// Copy from the "DocuBook — Themes" frame in docubook.pen. The colors are not here: the sections read every
// preset and the generated palette from @docubook/themes-colors, so the page cannot drift from the package.
// Wording mirrors packages/flame/docs/getting-started/themes.mdx.
export const presetCopy: Record<string, string> = {
  default: "Modern blue. Used by the official DocuBook website.",
  freshlime: "Warm lime. Designed for better contrast in dark mode.",
  coffee: "Rich coffee. An elegant brown with an expensive feel.",
};

export const customPrimary = "#FF5733";

export const themeFlag = {
  comments: [
    "# 01  Try a preset while you write",
    "# 02  Build with another one",
    "# 03  Preview with the default",
  ],
  runtimes: [
    {
      name: "flame",
      commands: [
        "flame dev --theme freshlime",
        "flame build --theme coffee",
        "flame preview --theme default",
      ],
    },
  ],
};
