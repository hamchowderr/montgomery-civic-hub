"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PropertyDetail } from "./PropertyDetail";
import type { VacantProperty } from "./types";

interface PropertyDetailSheetProps {
  property: VacantProperty | null;
  onClose: () => void;
}

export function PropertyDetailSheet({ property, onClose }: PropertyDetailSheetProps) {
  return (
    <Sheet open={!!property} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetTitle className="sr-only">Property Details</SheetTitle>
        <SheetDescription className="sr-only">
          Detailed information about the selected property
        </SheetDescription>
        {property && <PropertyDetail property={property} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}
