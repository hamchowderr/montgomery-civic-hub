"use client";

import { useThemeConfig } from "@/components/active-theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const RADII = [
  { value: "none", label: "0" },
  { value: "sm", label: ".3" },
  { value: "md", label: ".5" },
  { value: "lg", label: "1" },
  { value: "xl", label: "1.5" },
];

export function ThemeRadiusSelector() {
  const { theme, setTheme } = useThemeConfig();

  return (
    <div className="flex-1 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Radius</p>
      <ToggleGroup
        className="w-full"
        value={theme.radius}
        type="single"
        onValueChange={(value) => value && setTheme({ ...theme, radius: value as any })}
      >
        {RADII.map((r) => (
          <ToggleGroupItem
            key={r.value}
            variant="outline"
            className="h-7 grow px-1 text-[10px]"
            value={r.value}
          >
            {r.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
