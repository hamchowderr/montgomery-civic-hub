"use client";

import { useThemeConfig } from "@/components/active-theme";
import { Check } from "@/components/icons";
import { DEFAULT_THEME, THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function PresetSelector() {
  const { theme, setTheme } = useThemeConfig();

  const handlePreset = (value: string) => {
    setTheme({ ...theme, ...DEFAULT_THEME, preset: value as any });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Theme</p>
      <div className="grid grid-cols-4 gap-2.5">
        {THEMES.map((t) => {
          const isActive = theme.preset === t.value;
          return (
            <button
              key={t.value}
              onClick={() => handlePreset(t.value)}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition-colors",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-border hover:bg-muted/50",
              )}
            >
              <div className="flex gap-0.5">
                {t.colors.map((color, i) => (
                  <span
                    key={i}
                    className="size-4 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-[10px] leading-none text-muted-foreground">
                {t.name.split(" ")[0]}
              </span>
              {isActive && (
                <Check
                  size={14}
                  className="absolute -right-0.5 -top-0.5 rounded-full bg-primary p-0.5 text-primary-foreground"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
