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

const MONTGOMERY_CENTER: [number, number] = [-86.3077, 32.3792];

const markers = [
  {
    id: "city-hall",
    label: "Montgomery City Hall",
    description: "103 N Perry St",
    longitude: -86.3005,
    latitude: 32.3795,
  },
  {
    id: "water-treatment",
    label: "Water Treatment Plant",
    description: "2810 Eastern Blvd",
    longitude: -86.2635,
    latitude: 32.3548,
  },
  {
    id: "public-works",
    label: "Public Works Department",
    description: "120 N Decatur St",
    longitude: -86.3065,
    latitude: 32.3825,
  },
];

export function CityStaffMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Infrastructure Map</CardTitle>
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
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold">
                  I
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
