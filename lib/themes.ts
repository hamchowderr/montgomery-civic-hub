export const DEFAULT_THEME = {
  preset: "default",
  radius: "default",
  scale: "none",
} as const;

export type ThemeType = typeof DEFAULT_THEME;

export const THEMES = [
  // Page 1
  {
    name: "Default",
    value: "default",
    colors: ["hsl(220, 45%, 20%)", "hsl(16, 65%, 48%)"],
  },
  {
    name: "Underground",
    value: "underground",
    colors: ["hsl(156, 30%, 35%)", "hsl(337, 20%, 40%)"],
  },
  {
    name: "Rose Garden",
    value: "rose-garden",
    colors: ["hsl(12, 70%, 45%)", "hsl(6, 45%, 72%)"],
  },
  {
    name: "Lake View",
    value: "lake-view",
    colors: ["hsl(163, 55%, 48%)", "hsl(201, 25%, 38%)"],
  },
  {
    name: "Sunset Glow",
    value: "sunset-glow",
    colors: ["hsl(25, 55%, 40%)", "hsl(42, 50%, 65%)"],
  },
  {
    name: "Forest Whisper",
    value: "forest-whisper",
    colors: ["hsl(182, 40%, 35%)", "hsl(250, 12%, 38%)"],
  },
  {
    name: "Ocean Breeze",
    value: "ocean-breeze",
    colors: ["hsl(263, 60%, 42%)", "hsl(277, 55%, 45%)"],
  },
  {
    name: "Lavender Dream",
    value: "lavender-dream",
    colors: ["hsl(307, 45%, 42%)", "hsl(201, 15%, 58%)"],
  },
  // Page 2
  {
    name: "Midnight",
    value: "midnight",
    colors: ["hsl(230, 50%, 25%)", "hsl(210, 60%, 45%)"],
  },
  {
    name: "Cherry",
    value: "cherry",
    colors: ["hsl(350, 65%, 45%)", "hsl(340, 40%, 62%)"],
  },
  {
    name: "Sage",
    value: "sage",
    colors: ["hsl(145, 25%, 42%)", "hsl(135, 20%, 58%)"],
  },
  {
    name: "Amber",
    value: "amber",
    colors: ["hsl(35, 70%, 45%)", "hsl(28, 55%, 55%)"],
  },
  {
    name: "Slate",
    value: "slate",
    colors: ["hsl(215, 20%, 40%)", "hsl(215, 15%, 55%)"],
  },
  {
    name: "Coral",
    value: "coral",
    colors: ["hsl(15, 75%, 55%)", "hsl(8, 50%, 65%)"],
  },
  {
    name: "Indigo",
    value: "indigo",
    colors: ["hsl(245, 55%, 50%)", "hsl(255, 40%, 62%)"],
  },
  {
    name: "Copper",
    value: "copper",
    colors: ["hsl(20, 50%, 38%)", "hsl(30, 45%, 52%)"],
  },
];

/** Number of presets visible per page in the theme selector */
export const THEMES_PER_PAGE = 8;
