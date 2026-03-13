"use client";

import { useThemeConfig } from "@/components/active-theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SCALES = [
  { value: "none", label: "MD" },
  { value: "sm", label: "SM" },
  { value: "lg", label: "LG" },
];

export function ThemeScaleSelector() {
  const { theme, setTheme } = useThemeConfig();

  return (
    <div className="w-28 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Scale</p>
      <ToggleGroup
        className="w-full"
        value={theme.scale}
        type="single"
        onValueChange={(value) => value && setTheme({ ...theme, scale: value as any })}
      >
        {SCALES.map((s) => (
          <ToggleGroupItem
            key={s.value}
            variant="outline"
            className="h-7 grow px-1 text-[10px]"
            value={s.value}
          >
            {s.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
