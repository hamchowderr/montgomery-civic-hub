"use client";

import { useState } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  MapLayerFilter,
  type MapViewport,
} from "@/components/ui/map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMapData } from "@/lib/hooks/use-map-data";
import { useLayerVisibility } from "@/lib/hooks/use-layer-visibility";

const MONTGOMERY_CENTER: [number, number] = [-86.3077, 32.3792];

function getMarkerIcon(typeFacil: string | undefined): string {
  if (!typeFacil) return "H";
  const t = typeFacil.toLowerCase();
  if (t.includes("hospital")) return "H";
  if (t.includes("clinic")) return "C";
  if (t.includes("pharmacy")) return "Rx";
  if (t.includes("nursing") || t.includes("rehab")) return "N";
  return "H";
}

function getMarkerColor(typeFacil: string | undefined): string {
  if (!typeFacil) return "bg-blue-600";
  const t = typeFacil.toLowerCase();
  if (t.includes("hospital")) return "bg-red-600";
  if (t.includes("clinic")) return "bg-blue-600";
  if (t.includes("pharmacy")) return "bg-green-600";
  return "bg-blue-600";
}

export function ResidentMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  const { geojson, isLoading, layers } = useMapData("resident");
  const { visibleLayers, toggle, isVisible } = useLayerVisibility(layers);

  const hasFeatures =
    geojson &&
    geojson.features &&
    geojson.features.filter(
      (f) => f.geometry?.type === "Point" && isVisible(f.properties?._layerId),
    ).length > 0;

  return (
    <Card className="overflow-hidden" data-tour-step-id="resident-map">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Neighborhood Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <Map
            viewport={viewport}
            onViewportChange={setViewport}
            className="h-[500px] w-full"
          >
            <MapControls showZoom showLocate />
            <MapLayerFilter
              layers={layers}
              visibleLayers={visibleLayers}
              onToggle={toggle}
            />

            {/* Multi-layer markers from Convex */}
            {hasFeatures &&
              geojson.features
                .filter(
                  (f) =>
                    f.geometry?.type === "Point" &&
                    isVisible(f.properties?._layerId),
                )
                .map((feature, i) => {
                  const layerId = feature.properties?._layerId;
                  const coords = (feature.geometry as GeoJSON.Point)
                    .coordinates;
                  return (
                    <MapMarker
                      key={`${layerId}-${feature.properties?.OBJECTID ?? feature.properties?.Request_ID ?? i}`}
                      longitude={coords[0]}
                      latitude={coords[1]}
                    >
                      <MarkerContent>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${
                            layerId === "311-requests"
                              ? "bg-blue-500"
                              : layerId === "police"
                                ? "bg-red-600"
                                : layerId === "fire-stations"
                                  ? "bg-orange-500"
                                  : getMarkerColor(
                                      feature.properties?.TYPE_FACIL,
                                    )
                          }`}
                        >
                          {layerId === "311-requests"
                            ? "3"
                            : layerId === "police"
                              ? "P"
                              : layerId === "fire-stations"
                                ? "F"
                                : getMarkerIcon(feature.properties?.TYPE_FACIL)}
                        </div>
                      </MarkerContent>
                      <MarkerPopup>
                        {layerId === "311-requests" ? (
                          <div className="p-2">
                            <p className="text-xs font-semibold text-blue-600">
                              311 Request
                            </p>
                            <p className="text-sm font-medium">
                              {feature.properties?.Request_Type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {feature.properties?.Address}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Dept: {feature.properties?.Department}
                            </p>
                            {feature.properties?.Status && (
                              <p className="text-xs text-muted-foreground">
                                Status: {feature.properties.Status}
                              </p>
                            )}
                          </div>
                        ) : layerId === "police" ? (
                          <div className="p-2">
                            <p className="text-xs font-semibold text-red-600">
                              Police Facility
                            </p>
                            <p className="text-sm font-medium">
                              {feature.properties?.Facility_Name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {feature.properties?.Facility_Address}
                            </p>
                          </div>
                        ) : layerId === "fire-stations" ? (
                          <div className="p-2">
                            <p className="text-xs font-semibold text-orange-600">
                              Fire Station #{feature.properties?.Name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {feature.properties?.Address}
                            </p>
                          </div>
                        ) : (
                          <div className="p-2">
                            <p className="text-xs font-semibold text-green-600">
                              Health Care
                            </p>
                            <p className="text-sm font-medium">
                              {feature.properties?.COMPANY_NA}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {feature.properties?.ADDRESS}
                            </p>
                            {feature.properties?.TYPE_FACIL && (
                              <p className="text-xs text-muted-foreground">
                                Type: {feature.properties.TYPE_FACIL}
                              </p>
                            )}
                          </div>
                        )}
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
