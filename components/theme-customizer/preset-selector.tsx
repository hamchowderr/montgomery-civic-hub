"use client";

import { useState } from "react";
import { useThemeConfig } from "@/components/active-theme";
import { Check, ChevronLeft, ChevronRight } from "@/components/icons";
import { DEFAULT_THEME, THEMES, THEMES_PER_PAGE } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function PresetSelector() {
  const { theme, setTheme } = useThemeConfig();
  const [page, setPage] = useState(() => {
    const idx = THEMES.findIndex((t) => t.value === theme.preset);
    return idx >= THEMES_PER_PAGE ? 1 : 0;
  });

  const totalPages = Math.ceil(THEMES.length / THEMES_PER_PAGE);
  const pageThemes = THEMES.slice(page * THEMES_PER_PAGE, (page + 1) * THEMES_PER_PAGE);

  const handlePreset = (value: string) => {
    setTheme({ ...theme, ...DEFAULT_THEME, preset: value as any });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Theme</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="grid h-5 w-5 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {page + 1}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="grid h-5 w-5 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {pageThemes.map((t) => {
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
