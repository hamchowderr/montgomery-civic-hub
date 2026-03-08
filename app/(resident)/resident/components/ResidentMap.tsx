"use client";

import { useState } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapClusterLayer,
  MapControls,
  type MapViewport,
} from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTGOMERY_CENTER: [number, number] = [-86.3077, 32.3792];

const markers = [
  {
    id: "mpd-hq",
    label: "MPD Headquarters",
    longitude: -86.3005,
    latitude: 32.3771,
    type: "police" as const,
  },
  {
    id: "mpd-south",
    label: "MPD South Precinct",
    longitude: -86.2916,
    latitude: 32.3425,
    type: "police" as const,
  },
  {
    id: "fire-station-1",
    label: "Fire Station #1",
    longitude: -86.3095,
    latitude: 32.3813,
    type: "fire" as const,
  },
  {
    id: "fire-station-4",
    label: "Fire Station #4",
    longitude: -86.2718,
    latitude: 32.3665,
    type: "fire" as const,
  },
];

const emptyGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: [],
};

export function ResidentMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Neighborhood Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Map
          viewport={viewport}
          onViewportChange={setViewport}
          className="h-[500px] w-full"
        >
          <MapControls showZoom showLocate />

          {markers.map((marker) => (
            <MapMarker
              key={marker.id}
              longitude={marker.longitude}
              latitude={marker.latitude}
            >
              <MarkerContent>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${
                    marker.type === "police" ? "bg-blue-600" : "bg-red-600"
                  }`}
                >
                  {marker.type === "police" ? "P" : "F"}
                </div>
              </MarkerContent>
              <MarkerPopup>
                <div className="p-2 text-sm font-medium">{marker.label}</div>
              </MarkerPopup>
            </MapMarker>
          ))}

          <MapClusterLayer data={emptyGeoJSON} pointColor="#ef4444" />
        </Map>
      </CardContent>
    </Card>
  );
}
