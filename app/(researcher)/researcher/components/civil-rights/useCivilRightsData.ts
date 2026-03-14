"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TimelineLandmark } from "./types";
import { parseLandmarkFromGeoJSON } from "./utils";

interface UseCivilRightsDataOptions {
  onSelectLandmark?: (landmark: TimelineLandmark) => void;
}

export function useCivilRightsData({ onSelectLandmark }: UseCivilRightsDataOptions = {}) {
  const [landmarks, setLandmarks] = useState<TimelineLandmark[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/civil-rights-landmarks.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        const parsed = data.features.map(parseLandmarkFromGeoJSON).sort((a, b) => a.year - b.year);
        setLandmarks(parsed);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const selectedLandmark = useMemo(
    () => landmarks.find((l) => l.name === selectedName) ?? null,
    [landmarks, selectedName],
  );

  const eras = useMemo(() => {
    const seen = new Set<string>();
    return landmarks.reduce<string[]>((acc, l) => {
      if (!seen.has(l.era)) {
        seen.add(l.era);
        acc.push(l.era);
      }
      return acc;
    }, []);
  }, [landmarks]);

  const handleSelect = useCallback(
    (landmark: TimelineLandmark) => {
      setSelectedName((prev) => (prev === landmark.name ? null : landmark.name));
      onSelectLandmark?.(landmark);
    },
    [onSelectLandmark],
  );

  const scrollTimeline = useCallback((direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const viewport =
      container.closest("[data-radix-scroll-area-viewport]") ?? container.parentElement;
    if (!viewport) return;
    const scrollAmount = direction === "left" ? -340 : 340;
    viewport.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  return {
    landmarks,
    selectedName,
    setSelectedName,
    selectedLandmark,
    eras,
    isLoading,
    handleSelect,
    scrollTimeline,
    scrollRef,
  };
}
