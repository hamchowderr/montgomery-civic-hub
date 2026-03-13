export const DEFAULT_THEME = {
  preset: "default",
  radius: "default",
  scale: "none",
} as const;

export type ThemeType = typeof DEFAULT_THEME;

export const THEMES = [
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
];
