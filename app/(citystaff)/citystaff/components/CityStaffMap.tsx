"use client";

import { useState } from "react";
import {
  Map,
  MapPopup,
  MapControls,
  MapLineLayer,
  MapLayerFilter,
  type MapViewport,
} from "@/components/ui/map";

import { useMapData } from "@/lib/hooks/use-map-data";
import { useLayerVisibility } from "@/lib/hooks/use-layer-visibility";
import { CouncilDistrictsLayer } from "@/components/CouncilDistrictsLayer";
import {
  CITYSTAFF_STATUS_COLOR_EXPR,
  CITYSTAFF_LEGEND,
  STATUS_COLORS,
} from "@/components/StatusLegend";
import {
  type SelectedPoint,
  PointCircleLayer,
  MapLoadingOverlay,
} from "@/components/map-helpers";
import { MONTGOMERY_CENTER, MONTGOMERY_BOUNDS } from "@/lib/arcgis-helpers";

const CITYSTAFF_PAINT_COLOR = [
  "match",
  ["get", "_layerId"],
  "311-requests",
  "#3b82f6",
  "code-violations",
  CITYSTAFF_STATUS_COLOR_EXPR,
  "nuisance",
  "#d946ef",
  "city-properties",
  "#14b8a6",
  "tornado-sirens",
  "#f43f5e",
  "police",
  "#dc2626",
  "fire-stations",
  "#f97316",
  STATUS_COLORS.gray,
] as unknown as maplibregl.ExpressionSpecification;

function renderCityStaffPopup(props: Record<string, unknown>) {
  const layerId = props._layerId as string;

  if (layerId === "paving") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-amber-600">Paving Project</p>
        <p className="text-sm font-medium">{String(props.FULLNAME ?? "")}</p>
        {props.From_ && props.To_ ? (
          <p className="text-xs text-muted-foreground">
            {String(props.From_)} to {String(props.To_)}
          </p>
        ) : null}
        {props.DistrictDesc ? (
          <p className="text-xs text-muted-foreground">
            District: {String(props.DistrictDesc)}
          </p>
        ) : null}
        {props.Status ? (
          <p className="text-xs text-muted-foreground">
            Status: {String(props.Status)}
          </p>
        ) : null}
        {props.Year ? (
          <p className="text-xs text-muted-foreground">
            Year: {String(props.Year)}
          </p>
        ) : null}
      </div>
    );
  }

  if (layerId === "pavement") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-slate-600">
          Pavement Assessment
        </p>
        <p className="text-sm font-medium">{String(props.Street_Nam ?? "")}</p>
        {props.PCI != null ? (
          <p className="text-xs text-muted-foreground">
            PCI: {String(props.PCI)} / 100
          </p>
        ) : null}
        {props.Priority ? (
          <p className="text-xs text-muted-foreground">
            Priority: {String(props.Priority)}
          </p>
        ) : null}
        {props.Surf_Type ? (
          <p className="text-xs text-muted-foreground">
            Surface: {String(props.Surf_Type)}
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
        {props.Remark ? (
          <p className="text-xs text-muted-foreground">
            {String(props.Remark)}
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

  // Default: code violations
  return (
    <div className="space-y-1 p-1">
      <p className="text-xs font-semibold text-red-600">Code Violation</p>
      <p className="text-sm font-medium">
        {String(props.CaseType ?? "Code Violation")}
      </p>
      {props.Address1 ? (
        <p className="text-xs text-muted-foreground">
          {String(props.Address1)}
        </p>
      ) : null}
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

export function CityStaffMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 11,
    bearing: 0,
    pitch: 0,
  });

  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null,
  );

  const { geojson, layers, isLoading } = useMapData("citystaff");
  const { visibleLayers, toggle, isVisible } = useLayerVisibility(layers);

  const pointData: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features:
      geojson?.features?.filter(
        (f) =>
          f.geometry?.type === "Point" && isVisible(f.properties?._layerId),
      ) ?? [],
  };

  const lineFeatures =
    geojson?.features?.filter(
      (f) =>
        (f.geometry?.type === "LineString" ||
          f.geometry?.type === "MultiLineString") &&
        isVisible(f.properties?._layerId),
    ) ?? [];

  return (
    <div data-tour-step-id="citystaff-map" className="h-full min-h-[300px]">
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
            portal="citystaff"
            legendItems={CITYSTAFF_LEGEND}
          />

          {/* Line layers (paving projects + pavement assessment) */}
          {lineFeatures.length > 0 && (
            <MapLineLayer
              id="infrastructure-lines"
              data={{ type: "FeatureCollection", features: lineFeatures }}
              color="#f59e0b"
              width={5}
              opacity={0.8}
              onClick={(feature) => {
                const geom = feature.geometry as
                  | GeoJSON.LineString
                  | GeoJSON.MultiLineString;
                const coords =
                  geom.type === "LineString"
                    ? geom.coordinates
                    : geom.coordinates[0];
                const mid = coords[Math.floor(coords.length / 2)];
                setSelectedPoint({
                  coordinates: [mid[0], mid[1]],
                  properties: feature.properties ?? {},
                });
              }}
            />
          )}

          {/* Code violation points — layer-based */}
          <PointCircleLayer
            data={pointData}
            onSelect={setSelectedPoint}
            prefix="staff"
            paintColor={CITYSTAFF_PAINT_COLOR}
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
              {renderCityStaffPopup(selectedPoint.properties)}
            </MapPopup>
          )}
        </Map>

        {isLoading && <MapLoadingOverlay />}
      </div>
    </div>
  );
}
