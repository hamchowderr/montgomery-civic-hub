"use client";

import { useState } from "react";
import {
  Map,
  MapClusterLayer,
  MapPopup,
  MapControls,
  MapPolygonLayer,
  MapLayerFilter,
  type MapViewport,
} from "@/components/ui/map";

import { useMapData } from "@/lib/hooks/use-map-data";
import { useLayerVisibility } from "@/lib/hooks/use-layer-visibility";
import { CouncilDistrictsLayer } from "@/components/CouncilDistrictsLayer";
import { polygonCentroid, MapLoadingOverlay } from "@/components/map-helpers";
import { MONTGOMERY_CENTER, MONTGOMERY_BOUNDS } from "@/lib/arcgis-helpers";

const emptyGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: [],
};

interface ResearcherPointProperties {
  _layerId?: string;
  [key: string]: unknown;
}

function renderResearcherPopup(props: ResearcherPointProperties) {
  const layerId = props._layerId;

  if (layerId === "311-requests") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-blue-600">311 Request</p>
        <p className="text-sm font-medium">
          {String(props.Request_Type ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          Dept: {String(props.Department ?? "")}
        </p>
        {props.Status ? (
          <p className="text-xs text-muted-foreground">
            Status: {String(props.Status)}
          </p>
        ) : null}
        {props.District ? (
          <p className="text-xs text-muted-foreground">
            District: {String(props.District)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "code-violations") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-red-600">Code Violation</p>
        <p className="text-sm font-medium">{String(props.CaseType ?? "")}</p>
        {props.CaseStatus ? (
          <p className="text-xs text-muted-foreground">
            Status: {String(props.CaseStatus)}
          </p>
        ) : null}
        {props.District ? (
          <p className="text-xs text-muted-foreground">
            District: {String(props.District)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "nuisance") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-fuchsia-600">
          Nuisance Complaint
        </p>
        <p className="text-sm font-medium">
          {String(props.Type ?? "Nuisance")}
        </p>
        {props.Location ? (
          <p className="text-xs text-muted-foreground">
            {String(props.Location)}
          </p>
        ) : null}
        {props.District ? (
          <p className="text-xs text-muted-foreground">
            District: {String(props.District)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "business-licenses") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-blue-600">Business License</p>
        <p className="text-sm font-medium">
          {String(props.custCOMPANY_NAME ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(props.Full_Address ?? "")}
        </p>
        {props.scNAME ? (
          <p className="text-xs text-muted-foreground">
            Category: {String(props.scNAME)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "permits") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-amber-600">
          Construction Permit
        </p>
        <p className="text-sm font-medium">
          {String(props.PermitDescription ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(props.PhysicalAddress ?? "")}
        </p>
        {props.PermitStatus ? (
          <p className="text-xs text-muted-foreground">
            Status: {String(props.PermitStatus)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "city-properties") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-teal-600">
          City-Owned Property
        </p>
        <p className="text-sm font-medium">{String(props.PROP_ADDRE ?? "")}</p>
        {props.Use_ ? (
          <p className="text-xs text-muted-foreground">
            Use: {String(props.Use_)}
          </p>
        ) : null}
        {props.ZONING ? (
          <p className="text-xs text-muted-foreground">
            Zoning: {String(props.ZONING)}
          </p>
        ) : null}
        {props.CALC_ACRE ? (
          <p className="text-xs text-muted-foreground">
            {String(Number(props.CALC_ACRE).toFixed(2))} acres
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "census-tracts") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-purple-600">Census Tract</p>
        <p className="text-sm font-medium">
          {String(props.NAME20 ?? props.GEOID20 ?? "")}
        </p>
        {props.GEOID20 && props.NAME20 ? (
          <p className="text-xs text-muted-foreground">
            GEOID: {String(props.GEOID20)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "neighborhoods") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-cyan-600">Neighborhood</p>
        <p className="text-sm font-medium">{String(props.NEIGHBRHD ?? "")}</p>
      </div>
    );
  }

  // Fallback
  return (
    <div className="space-y-1 p-1">
      <p className="text-xs font-semibold text-muted-foreground">Data Point</p>
    </div>
  );
}

export function ResearcherMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  });

  const [selectedPoint, setSelectedPoint] = useState<{
    coordinates: [number, number];
    properties: ResearcherPointProperties;
  } | null>(null);

  const { geojson, isLoading, layers } = useMapData("researcher");
  const { visibleLayers, toggle, isVisible } = useLayerVisibility(layers);

  // Filter to visible Point features only
  const visibleFeatures =
    geojson?.features?.filter(
      (f) => f.geometry?.type === "Point" && isVisible(f.properties?._layerId),
    ) ?? [];

  const clusterData: GeoJSON.FeatureCollection<
    GeoJSON.Point,
    ResearcherPointProperties
  > =
    visibleFeatures.length > 0
      ? {
          type: "FeatureCollection",
          features: visibleFeatures as GeoJSON.Feature<
            GeoJSON.Point,
            ResearcherPointProperties
          >[],
        }
      : (emptyGeoJSON as GeoJSON.FeatureCollection<
          GeoJSON.Point,
          ResearcherPointProperties
        >);

  const polygonFeatures =
    geojson?.features?.filter(
      (f) =>
        (f.geometry?.type === "Polygon" ||
          f.geometry?.type === "MultiPolygon") &&
        isVisible(f.properties?._layerId),
    ) ?? [];

  const isEmpty = clusterData.features.length === 0 && !isLoading;

  return (
    <div data-tour-step-id="researcher-map" className="h-full">
      <div className="relative h-full">
        <Map
          viewport={viewport}
          onViewportChange={setViewport}
          maxBounds={MONTGOMERY_BOUNDS}
          className="h-full w-full"
        >
          <MapControls showZoom showCompass showFullscreen />
          <CouncilDistrictsLayer />
          <MapLayerFilter
            layers={layers}
            visibleLayers={visibleLayers}
            onToggle={toggle}
            portal="researcher"
          />

          {polygonFeatures.length > 0 && (
            <MapPolygonLayer
              id="researcher-polygons"
              data={{ type: "FeatureCollection", features: polygonFeatures }}
              fillColor="#06b6d4"
              fillOpacity={0.15}
              outlineColor="#06b6d4"
              outlineWidth={1}
              onClick={(feature) => {
                const coords = polygonCentroid(
                  feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
                );
                setSelectedPoint({
                  coordinates: coords,
                  properties: feature.properties ?? {},
                });
              }}
            />
          )}

          <MapClusterLayer<ResearcherPointProperties>
            data={clusterData}
            clusterRadius={50}
            clusterMaxZoom={14}
            clusterColors={["#22c55e", "#eab308", "#ef4444"]}
            clusterThresholds={[50, 200]}
            pointColor="#f97316"
            onPointClick={(feature, coordinates) => {
              setSelectedPoint({
                coordinates,
                properties: feature.properties,
              });
            }}
          />

          {selectedPoint && (
            <MapPopup
              key={`${selectedPoint.coordinates[0]}-${selectedPoint.coordinates[1]}`}
              longitude={selectedPoint.coordinates[0]}
              latitude={selectedPoint.coordinates[1]}
              onClose={() => setSelectedPoint(null)}
              closeOnClick={false}
              focusAfterOpen={false}
              closeButton
            >
              {renderResearcherPopup(selectedPoint.properties)}
            </MapPopup>
          )}
        </Map>

        {isLoading && <MapLoadingOverlay />}

        {/* Empty state message */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
            <div className="rounded-md bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm border">
              No civic data available yet
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
