"use client";

import { Palette } from "lucide-react";
import {
  PresetSelector,
  ResetThemeButton,
  ThemeRadiusSelector,
  ThemeScaleSelector,
} from "@/components/theme-customizer/index";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export function ThemeCustomizerPanel() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground sm:min-h-0 sm:min-w-0"
        >
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="me-4 w-80 p-4 shadow-xl lg:me-0" align="end">
        <PresetSelector />
        <Separator className="my-3" />
        <div className="flex gap-4">
          <ThemeRadiusSelector />
          <ThemeScaleSelector />
        </div>
        <Separator className="my-3" />
        <ResetThemeButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
