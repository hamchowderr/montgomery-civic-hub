"use client";

import { useState } from "react";
import {
  Map,
  MapClusterLayer,
  MapControls,
  MapLayerFilter,
  type MapViewport,
} from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMapData } from "@/lib/hooks/use-map-data";
import { useLayerVisibility } from "@/lib/hooks/use-layer-visibility";

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

  const { geojson, isLoading, layers } = useMapData("researcher");
  const { visibleLayers, toggle, isVisible } = useLayerVisibility(layers);

  // Filter to visible Point features only
  const visibleFeatures =
    geojson?.features?.filter(
      (f) => f.geometry?.type === "Point" && isVisible(f.properties?._layerId),
    ) ?? [];

  const clusterData: GeoJSON.FeatureCollection<GeoJSON.Point> =
    visibleFeatures.length > 0
      ? {
          type: "FeatureCollection",
          features: visibleFeatures as GeoJSON.Feature<GeoJSON.Point>[],
        }
      : emptyGeoJSON;

  const isEmpty = clusterData.features.length === 0 && !isLoading;

  return (
    <Card className="overflow-hidden" data-tour-step-id="researcher-map">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          311 &amp; Code Violations Density
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <Map
            viewport={viewport}
            onViewportChange={setViewport}
            className="h-[500px] w-full"
          >
            <MapControls showZoom />
            <MapLayerFilter
              layers={layers}
              visibleLayers={visibleLayers}
              onToggle={toggle}
            />
            <MapClusterLayer
              data={clusterData}
              clusterColors={["#22c55e", "#eab308", "#ef4444"]}
              clusterThresholds={[50, 200]}
              pointColor="#f97316"
            />
          </Map>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="rounded-md bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                Loading map data...
              </div>
            </div>
          )}

          {/* Empty state message */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
              <div className="rounded-md bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm border">
                No civic data available yet
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
