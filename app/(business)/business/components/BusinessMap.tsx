"use client";

import { useState } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  MapPolygonLayer,
  MapLayerFilter,
  type MapViewport,
} from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMapData } from "@/lib/hooks/use-map-data";
import { useLayerVisibility } from "@/lib/hooks/use-layer-visibility";

const MONTGOMERY_DOWNTOWN: [number, number] = [-86.3077, 32.3792];

/** Static institutional markers — real locations, always shown */
const INSTITUTIONAL_MARKERS = [
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

function formatCurrency(value: unknown): string {
  if (value == null) return "";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function BusinessMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_DOWNTOWN,
    zoom: 14,
    bearing: 0,
    pitch: 0,
  });

  const { geojson, isLoading, layers } = useMapData("business");
  const { visibleLayers, toggle, isVisible } = useLayerVisibility(layers);

  const pointFeatures =
    geojson?.features?.filter(
      (f) => f.geometry?.type === "Point" && isVisible(f.properties?._layerId),
    ) ?? [];

  const polygonFeatures =
    geojson?.features?.filter(
      (f) =>
        (f.geometry?.type === "Polygon" ||
          f.geometry?.type === "MultiPolygon") &&
        isVisible(f.properties?._layerId),
    ) ?? [];

  const hasFeatures = pointFeatures.length > 0 || polygonFeatures.length > 0;

  return (
    <Card className="overflow-hidden" data-tour-step-id="business-map">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Business District Map</CardTitle>
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

            {/* Entertainment district polygons — render before points so points appear on top */}
            {polygonFeatures.length > 0 && (
              <MapPolygonLayer
                id="entertainment-districts"
                data={{ type: "FeatureCollection", features: polygonFeatures }}
                fillColor="#a855f7"
                fillOpacity={0.2}
                outlineColor="#a855f7"
                outlineWidth={2}
              />
            )}

            {/* Static institutional markers — always visible */}
            {INSTITUTIONAL_MARKERS.map((marker) => (
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

            {/* Dynamic permit markers from Convex */}
            {pointFeatures.map((feature, i) => {
              const layerId = feature.properties?._layerId;
              return (
                <MapMarker
                  key={`${layerId}-${feature.properties?.OBJECTID ?? feature.properties?.PermitNo ?? `biz-${i}`}`}
                  longitude={(feature.geometry as GeoJSON.Point).coordinates[0]}
                  latitude={(feature.geometry as GeoJSON.Point).coordinates[1]}
                >
                  <MarkerContent>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                      P
                    </div>
                  </MarkerContent>
                  <MarkerPopup>
                    <div className="p-2">
                      <p className="text-sm font-medium">
                        {feature.properties?.PermitDescription ?? "Permit"}
                      </p>
                      {feature.properties?.PhysicalAddress && (
                        <p className="text-xs text-muted-foreground">
                          {feature.properties.PhysicalAddress}
                        </p>
                      )}
                      {feature.properties?.EstimatedCost != null && (
                        <p className="text-xs text-muted-foreground">
                          Cost:{" "}
                          {formatCurrency(feature.properties.EstimatedCost)}
                        </p>
                      )}
                      {feature.properties?.PermitStatus && (
                        <p className="text-xs text-muted-foreground">
                          Status: {feature.properties.PermitStatus}
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
