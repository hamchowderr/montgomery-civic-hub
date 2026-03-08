"use client";

import { useState } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  type MapViewport,
} from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTGOMERY_DOWNTOWN: [number, number] = [-86.3077, 32.3792];

const markers = [
  {
    id: "city-hall",
    label: "Montgomery City Hall",
    description: "103 N Perry St, Montgomery, AL 36104",
    longitude: -86.3005,
    latitude: 32.3795,
  },
  {
    id: "permit-office",
    label: "Permit & Inspections Office",
    description: "101 S Lawrence St, Montgomery, AL 36104",
    longitude: -86.3055,
    latitude: 32.3762,
  },
  {
    id: "chamber",
    label: "Chamber of Commerce",
    description: "41 Commerce St, Montgomery, AL 36104",
    longitude: -86.3102,
    latitude: 32.3778,
  },
];

export function BusinessMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_DOWNTOWN,
    zoom: 14,
    bearing: 0,
    pitch: 0,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Business District Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Map
          viewport={viewport}
          onViewportChange={setViewport}
          className="h-[500px] w-full"
        >
          <MapControls showZoom />

          {markers.map((marker) => (
            <MapMarker
              key={marker.id}
              longitude={marker.longitude}
              latitude={marker.latitude}
            >
              <MarkerContent>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                  B
                </div>
              </MarkerContent>
              <MarkerPopup>
                <div className="p-2">
                  <p className="text-sm font-medium">{marker.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {marker.description}
                  </p>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>
      </CardContent>
    </Card>
  );
}
