"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useMap, MapPopup } from "@/components/ui/map";
import { LayerFilterPortal } from "@/components/DataPanel";
import { ARCGIS_URLS, queryFeaturesAsGeoJSON } from "@/lib/arcgis-client";
import { Button } from "@/components/ui/button";
import { Layers, X } from "lucide-react";
import type MapLibreGL from "maplibre-gl";

// One color per district (9 districts)
const DISTRICT_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
];

interface DistrictInfo {
  name: string;
  district: string;
  phone: string;
  email: string;
  coordinates: [number, number];
}

export function CouncilDistrictsLayer() {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `council-districts-${id}`;
  const fillLayerId = `districts-fill-${id}`;
  const outlineLayerId = `districts-outline-${id}`;
  const labelLayerId = `districts-label-${id}`;

  const [visible, setVisible] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo | null>(
    null,
  );
  const dataRef = useRef<GeoJSON.FeatureCollection | null>(null);

  // Fetch district polygons (lazy — only when toggled on)
  const loadData = useCallback(async () => {
    if (dataRef.current) return dataRef.current;

    const fc = await queryFeaturesAsGeoJSON({
      url: ARCGIS_URLS.councilDistricts,
      outFields: "Name,District,Phone,Email,Address",
      where: "1=1",
    });
    dataRef.current = fc;
    return fc;
  }, []);

  // Add/remove layers
  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!visible) {
      // Hide layers if they exist
      if (map.getLayer(fillLayerId))
        map.setLayoutProperty(fillLayerId, "visibility", "none");
      if (map.getLayer(outlineLayerId))
        map.setLayoutProperty(outlineLayerId, "visibility", "none");
      if (map.getLayer(labelLayerId))
        map.setLayoutProperty(labelLayerId, "visibility", "none");
      return;
    }

    // Load data then add layers
    loadData().then((fc) => {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "geojson", data: fc });
      }

      if (!map.getLayer(fillLayerId)) {
        // Build a match expression for district colors
        const colorExpr: unknown[] = ["match", ["get", "District"]];
        for (let i = 0; i < 9; i++) {
          colorExpr.push(`District ${i + 1}`, DISTRICT_COLORS[i]);
        }
        colorExpr.push("#888"); // fallback

        map.addLayer(
          {
            id: fillLayerId,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": colorExpr as maplibregl.ExpressionSpecification,
              "fill-opacity": 0.15,
            },
          },
          // Insert below point/symbol layers so districts don't cover markers
          map.getStyle().layers.find((l) => l.type === "symbol")?.id,
        );
      }

      if (!map.getLayer(outlineLayerId)) {
        const colorExpr: unknown[] = ["match", ["get", "District"]];
        for (let i = 0; i < 9; i++) {
          colorExpr.push(`District ${i + 1}`, DISTRICT_COLORS[i]);
        }
        colorExpr.push("#888");

        map.addLayer(
          {
            id: outlineLayerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": colorExpr as maplibregl.ExpressionSpecification,
              "line-width": 2,
              "line-opacity": 0.7,
            },
          },
          map.getStyle().layers.find((l) => l.type === "symbol")?.id,
        );
      }

      if (!map.getLayer(labelLayerId)) {
        map.addLayer({
          id: labelLayerId,
          type: "symbol",
          source: sourceId,
          layout: {
            "text-field": ["get", "District"],
            "text-size": 11,
            "text-font": ["Open Sans Bold"],
          },
          paint: {
            "text-color": "hsl(0 0% 30%)",
            "text-halo-color": "hsl(0 0% 100%)",
            "text-halo-width": 1.5,
          },
        });
      }

      // Show layers
      map.setLayoutProperty(fillLayerId, "visibility", "visible");
      map.setLayoutProperty(outlineLayerId, "visibility", "visible");
      map.setLayoutProperty(labelLayerId, "visibility", "visible");
      setDataLoaded(true);
    });
  }, [
    map,
    isLoaded,
    visible,
    loadData,
    sourceId,
    fillLayerId,
    outlineLayerId,
    labelLayerId,
  ]);

  // Click handler for district polygons
  useEffect(() => {
    if (!map || !isLoaded || !dataLoaded) return;

    const handleClick = (
      e: MapLibreGL.MapMouseEvent & {
        features?: MapLibreGL.MapGeoJSONFeature[];
      },
    ) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId],
      });
      if (!features.length) return;

      const props = features[0].properties;
      setSelectedDistrict({
        name: props?.Name ?? "",
        district: props?.District ?? "",
        phone: props?.Phone ?? "",
        email: props?.Email ?? "",
        coordinates: [e.lngLat.lng, e.lngLat.lat],
      });
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", fillLayerId, handleClick);
    map.on("mouseenter", fillLayerId, handleMouseEnter);
    map.on("mouseleave", fillLayerId, handleMouseLeave);

    return () => {
      map.off("click", fillLayerId, handleClick);
      map.off("mouseenter", fillLayerId, handleMouseEnter);
      map.off("mouseleave", fillLayerId, handleMouseLeave);
    };
  }, [map, isLoaded, dataLoaded, fillLayerId]);

  // AI-readable: council districts state
  useCopilotReadable({
    description:
      "Council districts overlay visibility and selected district info",
    value: {
      visible,
      dataLoaded,
      selectedDistrict: selectedDistrict
        ? { name: selectedDistrict.name, district: selectedDistrict.district }
        : null,
    },
  });

  // AI action: toggle council districts overlay
  useCopilotAction({
    name: "toggle_council_districts",
    description:
      "Show or hide the council districts overlay on the map. Districts show colored boundaries for all 9 Montgomery council districts.",
    parameters: [
      {
        name: "visible",
        type: "boolean",
        description: "Whether to show (true) or hide (false) council districts",
        required: true,
      },
    ],
    handler: ({ visible: show }) => {
      setVisible(show);
      if (!show) setSelectedDistrict(null);
      return show ? "Council districts shown" : "Council districts hidden";
    },
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      const container = map?.getContainer();
      setIsFullscreen(
        !!document.fullscreenElement &&
          document.fullscreenElement === container,
      );
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [map]);

  const toggleButton = (
    <Button
      size="sm"
      variant={visible ? "default" : "secondary"}
      onClick={() => {
        setVisible((v) => !v);
        if (visible) setSelectedDistrict(null);
      }}
    >
      {visible ? (
        <X className="size-4 mr-1.5" />
      ) : (
        <Layers className="size-4 mr-1.5" />
      )}
      {visible ? "Hide Districts" : "Show Districts"}
    </Button>
  );

  return (
    <>
      {isFullscreen ? (
        <div className="absolute top-3 left-3 z-10">{toggleButton}</div>
      ) : (
        <LayerFilterPortal>{toggleButton}</LayerFilterPortal>
      )}

      {selectedDistrict && visible && (
        <MapPopup
          key={`${selectedDistrict.coordinates[0]}-${selectedDistrict.coordinates[1]}`}
          longitude={selectedDistrict.coordinates[0]}
          latitude={selectedDistrict.coordinates[1]}
          onClose={() => setSelectedDistrict(null)}
          closeOnClick={false}
          focusAfterOpen={false}
          closeButton
        >
          <div className="min-w-[160px] space-y-1 p-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {selectedDistrict.district}
            </p>
            <p className="text-sm font-medium">{selectedDistrict.name}</p>
            {selectedDistrict.phone && (
              <p className="text-xs text-muted-foreground">
                {selectedDistrict.phone}
              </p>
            )}
            {selectedDistrict.email && (
              <p className="text-xs text-muted-foreground">
                {selectedDistrict.email}
              </p>
            )}
          </div>
        </MapPopup>
      )}
    </>
  );
}
