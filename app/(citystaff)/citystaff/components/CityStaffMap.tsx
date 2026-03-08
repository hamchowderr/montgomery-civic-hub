"use client";

import { useState } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  MapLineLayer,
  MapLayerFilter,
  type MapViewport,
} from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMapData } from "@/lib/hooks/use-map-data";
import { useLayerVisibility } from "@/lib/hooks/use-layer-visibility";

const MONTGOMERY_CENTER: [number, number] = [-86.3077, 32.3792];

export function CityStaffMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  const { geojson, layers, isLoading } = useMapData("citystaff");
  const { visibleLayers, toggle, isVisible } = useLayerVisibility(layers);

  const pointFeatures =
    geojson?.features?.filter(
      (f) => f.geometry?.type === "Point" && isVisible(f.properties?._layerId),
    ) ?? [];

  const lineFeatures =
    geojson?.features?.filter(
      (f) =>
        (f.geometry?.type === "LineString" ||
          f.geometry?.type === "MultiLineString") &&
        isVisible(f.properties?._layerId),
    ) ?? [];

  const hasFeatures = pointFeatures.length > 0 || lineFeatures.length > 0;

  return (
    <Card className="overflow-hidden" data-tour-step-id="citystaff-map">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Infrastructure Map</CardTitle>
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

            {/* Paving project polylines */}
            {lineFeatures.length > 0 && (
              <MapLineLayer
                id="paving-projects"
                data={{ type: "FeatureCollection", features: lineFeatures }}
                color="#f59e0b"
                width={3}
                opacity={0.8}
              />
            )}

            {/* Code violation markers */}
            {hasFeatures &&
              pointFeatures.map((feature, i) => {
                const layerId = feature.properties?._layerId;
                return (
                  <MapMarker
                    key={`${layerId}-${feature.properties?.OBJECTID ?? feature.properties?.OffenceNum ?? `staff-${i}`}`}
                    longitude={
                      (feature.geometry as GeoJSON.Point).coordinates[0]
                    }
                    latitude={
                      (feature.geometry as GeoJSON.Point).coordinates[1]
                    }
                  >
                    <MarkerContent>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                        V
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="p-2">
                        <p className="text-sm font-medium">
                          {feature.properties?.CaseType ?? "Code Violation"}
                        </p>
                        {feature.properties?.Address1 && (
                          <p className="text-xs text-muted-foreground">
                            {feature.properties.Address1}
                          </p>
                        )}
                        {feature.properties?.CaseStatus && (
                          <p className="text-xs text-muted-foreground">
                            Status: {feature.properties.CaseStatus}
                          </p>
                        )}
                        {feature.properties?.District && (
                          <p className="text-xs text-muted-foreground">
                            District: {feature.properties.District}
                          </p>
                        )}
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                );
              })}
          </Map>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="rounded-md bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                Loading map data...
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
