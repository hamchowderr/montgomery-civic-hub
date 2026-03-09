"use client";

import { useState } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
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
  BUSINESS_STATUS_COLOR_EXPR,
  BUSINESS_LEGEND,
  STATUS_COLORS,
} from "@/components/StatusLegend";
import {
  type SelectedPoint,
  PointCircleLayer,
  polygonCentroid,
  MapLoadingOverlay,
} from "@/components/map-helpers";
import {
  MONTGOMERY_CENTER,
  MONTGOMERY_BOUNDS,
  formatCurrency,
} from "@/lib/arcgis-helpers";

/** Static institutional markers — real locations, always shown (only 3, fine as DOM) */
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

const BUSINESS_PAINT_COLOR = [
  "match",
  ["get", "_layerId"],
  "permits",
  BUSINESS_STATUS_COLOR_EXPR,
  "business-licenses",
  "#3b82f6",
  "city-properties",
  "#14b8a6",
  STATUS_COLORS.gray,
] as unknown as maplibregl.ExpressionSpecification;

function renderBusinessPopup(props: Record<string, unknown>) {
  const layerId = props._layerId as string;

  if (layerId === "entertainment-districts") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-purple-600">
          Entertainment District
        </p>
        {props.Ordinance ? (
          <p className="text-sm font-medium">{String(props.Ordinance)}</p>
        ) : null}
        {props.Approved ? (
          <p className="text-xs text-muted-foreground">
            Approved by: {String(props.Approved)}
          </p>
        ) : null}
        {props.Adopt_Date ? (
          <p className="text-xs text-muted-foreground">
            Adopted: {new Date(Number(props.Adopt_Date)).toLocaleDateString()}
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
        {props.custDBA ? (
          <p className="text-xs text-muted-foreground">
            DBA: {String(props.custDBA)}
          </p>
        ) : null}
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

  if (layerId === "zoning") {
    return (
      <div className="space-y-1 p-1">
        <p className="text-xs font-semibold text-violet-600">Zoning District</p>
        <p className="text-sm font-medium">{String(props.ZoningCode ?? "")}</p>
        {props.ZoningDesc ? (
          <p className="text-xs text-muted-foreground">
            {String(props.ZoningDesc)}
          </p>
        ) : null}
        {props.Ordinance ? (
          <p className="text-xs text-muted-foreground">
            Ordinance: {String(props.Ordinance)}
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

  // Default: permits
  return (
    <div className="space-y-1 p-1">
      <p className="text-xs font-semibold text-amber-600">Permit</p>
      <p className="text-sm font-medium">
        {String(props.PermitDescription ?? "Permit")}
      </p>
      {props.PhysicalAddress ? (
        <p className="text-xs text-muted-foreground">
          {String(props.PhysicalAddress)}
        </p>
      ) : null}
      {props.EstimatedCost != null ? (
        <p className="text-xs text-muted-foreground">
          Cost: {formatCurrency(props.EstimatedCost)}
        </p>
      ) : null}
      {props.PermitStatus ? (
        <p className="text-xs text-muted-foreground">
          Status: {String(props.PermitStatus)}
        </p>
      ) : null}
    </div>
  );
}

export function BusinessMap() {
  const [viewport, setViewport] = useState<MapViewport>({
    center: MONTGOMERY_CENTER,
    zoom: 13,
    bearing: 0,
    pitch: 0,
  });

  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null,
  );

  const { geojson, isLoading, layers } = useMapData("business");
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

  return (
    <div data-tour-step-id="business-map" className="h-full min-h-[300px]">
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
            portal="business"
            legendItems={BUSINESS_LEGEND}
          />

          {/* Entertainment district polygons */}
          {polygonFeatures.length > 0 && (
            <MapPolygonLayer
              id="entertainment-districts"
              data={{ type: "FeatureCollection", features: polygonFeatures }}
              fillColor="#a855f7"
              fillOpacity={0.2}
              outlineColor="#a855f7"
              outlineWidth={2}
              onClick={(feature) => {
                const coords = polygonCentroid(
                  feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
                );
                setSelectedPoint({
                  coordinates: coords,
                  properties: {
                    ...feature.properties,
                    _layerId: "entertainment-districts",
                  },
                });
              }}
            />
          )}

          {/* Static institutional markers (only 3 — DOM is fine) */}
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

          {/* Dynamic permit points — layer-based for performance */}
          <PointCircleLayer
            data={pointData}
            onSelect={setSelectedPoint}
            prefix="biz"
            paintColor={BUSINESS_PAINT_COLOR}
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
              {renderBusinessPopup(selectedPoint.properties)}
            </MapPopup>
          )}
        </Map>

        {isLoading && <MapLoadingOverlay />}
      </div>
    </div>
  );
}
