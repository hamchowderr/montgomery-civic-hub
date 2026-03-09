"use client";

import { useEffect, useId } from "react";
import { useMap } from "@/components/ui/map";
import type MapLibreGL from "maplibre-gl";

// ── Shared types ────────────────────────────────────────────────────────────

export interface SelectedPoint {
  coordinates: [number, number];
  properties: Record<string, unknown>;
}

// ── Reusable MapLibre circle-point layer ────────────────────────────────────

/**
 * Adds a GeoJSON source + circle layer to the map with click/cursor handlers.
 * All four portal maps use this pattern — only the paint expression differs.
 */
export function PointCircleLayer({
  data,
  onSelect,
  prefix,
  paintColor,
}: {
  data: GeoJSON.FeatureCollection;
  onSelect: (point: SelectedPoint) => void;
  /** Prefix for source/layer IDs (e.g. "resident", "biz", "staff") */
  prefix: string;
  /** MapLibre circle-color expression or string */
  paintColor: maplibregl.ExpressionSpecification | string;
}) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `${prefix}-points-${id}`;
  const layerId = `${prefix}-circles-${id}`;

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: "geojson", data });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": paintColor as any,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    const handleClick = (
      e: MapLibreGL.MapMouseEvent & {
        features?: MapLibreGL.MapGeoJSONFeature[];
      },
    ) => {
      if (!e.features?.length) return;
      const feature = e.features[0];
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [
        number,
        number,
      ];
      onSelect({ coordinates: coords, properties: feature.properties ?? {} });
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", layerId, handleClick);
    map.on("mouseenter", layerId, handleMouseEnter);
    map.on("mouseleave", layerId, handleMouseLeave);

    return () => {
      map.off("click", layerId, handleClick);
      map.off("mouseenter", layerId, handleMouseEnter);
      map.off("mouseleave", layerId, handleMouseLeave);

      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore cleanup errors during unmount
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (source) source.setData(data);
  }, [map, isLoaded, data, sourceId]);

  return null;
}

// ── Polygon/MultiPolygon centroid ───────────────────────────────────────────

/** Compute the centroid of a Polygon or MultiPolygon's outer ring. */
export function polygonCentroid(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): [number, number] {
  const ring =
    geometry.type === "Polygon"
      ? geometry.coordinates[0]
      : geometry.coordinates[0][0];
  const cx = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  const cy = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  return [cx, cy];
}

// ── Loading overlay ─────────────────────────────────────────────────────────

/** Semi-transparent loading overlay shown while map data is fetching. */
export function MapLoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
      <div className="rounded-md bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
        Loading map data...
      </div>
    </div>
  );
}
