"use client";

import { useState } from "react";
import {
  Map,
  MapPopup,
  MapControls,
  MapPolygonLayer,
  MapLayerFilter,
  type MapViewport,
} from "@/components/ui/map";

import { useMapData } from "@/lib/hooks/use-map-data";
import { useLayerVisibility } from "@/lib/hooks/use-layer-visibility";
import { CouncilDistrictsLayer } from "@/components/CouncilDistrictsLayer";
import {
  RESIDENT_STATUS_COLOR_EXPR,
  RESIDENT_LEGEND,
} from "@/components/StatusLegend";
import {
  type SelectedPoint,
  PointCircleLayer,
  polygonCentroid,
  MapLoadingOverlay,
} from "@/components/map-helpers";
import { MONTGOMERY_CENTER, MONTGOMERY_BOUNDS } from "@/lib/arcgis-helpers";

const RESIDENT_PAINT_COLOR = [
  "match",
  ["get", "_layerId"],
  "311-requests",
  RESIDENT_STATUS_COLOR_EXPR,
  "police",
  "#dc2626",
  "fire-stations",
  "#f97316",
  "health-care",
  "#16a34a",
  "community-centers",
  "#8b5cf6",
  "libraries",
  "#6366f1",
  "education",
  "#0ea5e9",
  "daycare",
  "#ec4899",
  "recycling",
  "#10b981",
  "tornado-sirens",
  "#f43f5e",
  "code-violations",
  "#ef4444",
  "nuisance",
  "#d946ef",
  "city-properties",
  "#14b8a6",
  "parks",
  "#22c55e",
  "#9ca3af",
] as unknown as maplibregl.ExpressionSpecification;

function renderPopupContent(props: Record<string, unknown>) {
  const layerId = props._layerId as string;

  if (layerId === "311-requests") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-blue-600">311 Request</p>
        <p className="text-sm font-medium">
          {String(props.Request_Type ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(props.Address ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          Dept: {String(props.Department ?? "")}
        </p>
        {props.Status ? (
          <p className="text-xs text-muted-foreground">
            Status: {String(props.Status)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "police") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-red-600">Police Facility</p>
        <p className="text-sm font-medium">
          {String(props.Facility_Name ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(props.Facility_Address ?? "")}
        </p>
      </div>
    );
  }

  if (layerId === "fire-stations") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-orange-600">
          Fire Station #{String(props.Name ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(props.Address ?? "")}
        </p>
      </div>
    );
  }

  if (layerId === "community-centers") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-violet-600">
          Community Center
        </p>
        <p className="text-sm font-medium">{String(props.FACILITY_N ?? "")}</p>
        <p className="text-xs text-muted-foreground">
          {String(props.ADDRESS ?? "")}
        </p>
        {props.TYPE ? (
          <p className="text-xs text-muted-foreground">
            Type: {String(props.TYPE)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "libraries") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-indigo-600">Library</p>
        <p className="text-sm font-medium">{String(props.BRANCH_NAME ?? "")}</p>
        <p className="text-xs text-muted-foreground">
          {String(props.ADDRESS ?? "")}
        </p>
      </div>
    );
  }

  if (layerId === "education") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-sky-600">School</p>
        <p className="text-sm font-medium">{String(props.NAME ?? "")}</p>
        <p className="text-xs text-muted-foreground">
          {String(props.Address ?? "")}
        </p>
        {props.Level_ ? (
          <p className="text-xs text-muted-foreground">
            Level: {String(props.Level_)}
          </p>
        ) : null}
        {props.TELEPHONE ? (
          <p className="text-xs text-muted-foreground">
            {String(props.TELEPHONE)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "daycare") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-pink-600">Daycare Center</p>
        <p className="text-sm font-medium">{String(props.Name ?? "")}</p>
        <p className="text-xs text-muted-foreground">
          {String(props.Address ?? "")}
        </p>
        {props.Day_Hours ? (
          <p className="text-xs text-muted-foreground">
            Hours: {String(props.Day_Hours)}
          </p>
        ) : null}
        {props.Day_Ages ? (
          <p className="text-xs text-muted-foreground">
            Ages: {String(props.Day_Ages)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "recycling") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-emerald-600">
          Recycling Location
        </p>
        <p className="text-sm font-medium">{String(props.LOCATION ?? "")}</p>
        <p className="text-xs text-muted-foreground">
          {String(props.ADDRESS ?? "")}
        </p>
        {props.HOURS ? (
          <p className="text-xs text-muted-foreground">
            Hours: {String(props.HOURS)}
          </p>
        ) : null}
        {props.PRODUCTS ? (
          <p className="text-xs text-muted-foreground">
            Accepts: {String(props.PRODUCTS)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "tornado-sirens") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-rose-600">Tornado Siren</p>
        <p className="text-sm font-medium">{String(props.Location_A ?? "")}</p>
        {props.Brand ? (
          <p className="text-xs text-muted-foreground">
            Brand: {String(props.Brand)}
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
        {props.Address1 ? (
          <p className="text-xs text-muted-foreground">
            {String(props.Address1)}
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

  if (layerId === "parks") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-green-600">City Park</p>
        <p className="text-sm font-medium">
          {String(props.PARK_NAME ?? props.NAME ?? "Park")}
        </p>
        {props.ADDRESS ? (
          <p className="text-xs text-muted-foreground">
            {String(props.ADDRESS)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "flood-zones") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-sky-600">Flood Hazard Area</p>
        {props.FLD_ZONE ? (
          <p className="text-sm font-medium">Zone: {String(props.FLD_ZONE)}</p>
        ) : null}
        {props.FLOODWAY ? (
          <p className="text-xs text-muted-foreground">
            Floodway: {String(props.FLOODWAY)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "garbage-schedule") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-stone-600">
          Garbage Collection Schedule
        </p>
        {props.Day_1 ? (
          <p className="text-sm font-medium">Day 1: {String(props.Day_1)}</p>
        ) : null}
        {props.Day_2 ? (
          <p className="text-sm font-medium">Day 2: {String(props.Day_2)}</p>
        ) : null}
      </div>
    );
  }

  if (layerId === "curbside-trash") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-stone-600">
          Curbside Trash Pickup
        </p>
        {props.TDAY ? (
          <p className="text-sm font-medium">
            Pickup Day: {String(props.TDAY)}
          </p>
        ) : null}
      </div>
    );
  }

  // Healthcare (default)
  return (
    <div className="space-y-1 p-1">
      <p className="text-xs font-semibold text-green-600">Health Care</p>
      <p className="text-sm font-medium">{String(props.COMPANY_NA ?? "")}</p>
      <p className="text-xs text-muted-foreground">
        {String(props.ADDRESS ?? "")}
      </p>
      {props.TYPE_FACIL ? (
        <p className="text-xs text-muted-foreground">
          Type: {String(props.TYPE_FACIL)}
        </p>
      ) : null}
    </div>
  );
}

export function ResidentMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 11,
    bearing: 0,
    pitch: 0,
  });

  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null,
  );

  const { geojson, isLoading, layers } = useMapData("resident");
  const { visibleLayers, toggle, isVisible } = useLayerVisibility(layers);

  const pointData: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features:
      geojson?.features?.filter(
        (f) =>
          f.geometry?.type === "Point" && isVisible(f.properties?._layerId),
      ) ?? [],
  };

  const polygonFeatures =
    geojson?.features?.filter(
      (f) =>
        (f.geometry?.type === "Polygon" ||
          f.geometry?.type === "MultiPolygon") &&
        isVisible(f.properties?._layerId),
    ) ?? [];

  // Show legend only when 311 layer is visible
  const show311Legend = isVisible("311-requests");

  return (
    <div data-tour-step-id="resident-map">
      <div className="relative">
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
            portal="resident"
            legendItems={show311Legend ? RESIDENT_LEGEND : undefined}
          />

          {polygonFeatures.length > 0 && (
            <MapPolygonLayer
              id="resident-polygons"
              data={{ type: "FeatureCollection", features: polygonFeatures }}
              fillColor="#78716c"
              fillOpacity={0.15}
              outlineColor="#78716c"
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

          <PointCircleLayer
            data={pointData}
            onSelect={setSelectedPoint}
            prefix="resident"
            paintColor={RESIDENT_PAINT_COLOR}
          />

          {selectedPoint && (
            <MapPopup
              key={`${selectedPoint.coordinates[0]}-${selectedPoint.coordinates[1]}`}
              longitude={selectedPoint.coordinates[0]}
              latitude={selectedPoint.coordinates[1]}
              onClose={() => setSelectedPoint(null)}
              closeOnClick={false}
              focusAfterOpen={false}
              offset={10}
              closeButton
            >
              {renderPopupContent(selectedPoint.properties)}
            </MapPopup>
          )}
        </Map>

        {isLoading && <MapLoadingOverlay />}
      </div>
    </div>
  );
}
