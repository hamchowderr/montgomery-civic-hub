"use client";

import { useState } from "react";
import {
  Map,
  MapClusterLayer,
  MapControls,
  type MapViewport,
} from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTGOMERY_CENTER: [number, number] = [-86.3077, 32.3792];

const emptyGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: [],
};

export function ResearcherMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 11,
    bearing: 0,
    pitch: 0,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">911 Call Density</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Map
          viewport={viewport}
          onViewportChange={setViewport}
          className="h-[500px] w-full"
        >
          <MapControls showZoom />
          <MapClusterLayer
            data={emptyGeoJSON}
            clusterColors={["#22c55e", "#eab308", "#ef4444"]}
            clusterThresholds={[50, 200]}
            pointColor="#f97316"
          />
        </Map>
      </CardContent>
    </Card>
  );
}
