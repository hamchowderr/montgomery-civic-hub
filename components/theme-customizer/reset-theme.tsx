"use client";

import { useThemeConfig } from "@/components/active-theme";
import { RotateCcw } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DEFAULT_THEME } from "@/lib/themes";

export function ResetThemeButton() {
  const { setTheme } = useThemeConfig();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full gap-1.5 text-xs text-muted-foreground"
      onClick={() => setTheme(DEFAULT_THEME)}
    >
      <RotateCcw size={12} />
      Reset
    </Button>
  );
}
