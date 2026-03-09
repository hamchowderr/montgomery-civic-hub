"use client";

import { useCallback, useEffect, useState } from "react";
import type { MapLayer } from "@/lib/hooks/use-map-data";

export function useLayerVisibility(layers: MapLayer[]) {
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());

  // Initialize: all layers visible when layers array first populates
  useEffect(() => {
    if (layers.length > 0) {
      setVisibleLayers(new Set(layers.map((l) => l.id)));
    }
  }, [layers]);

  const toggle = useCallback((layerId: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }, []);

  const setLayerVisible = useCallback((layerId: string, visible: boolean) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (visible) next.add(layerId);
      else next.delete(layerId);
      return next;
    });
  }, []);

  const isVisible = useCallback(
    (layerId: string) => visibleLayers.has(layerId),
    [visibleLayers],
  );

  return { visibleLayers, toggle, setLayerVisible, isVisible };
}
