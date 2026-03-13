"use client";

import { useEffect, useState } from "react";

interface TimelineLandmark {
  name: string;
  year: number;
  event: string;
  description: string;
  coordinates: [number, number];
}

interface CivilRightsTimelineProps {
  onSelectLandmark: (landmark: TimelineLandmark) => void;
}

export function CivilRightsTimeline({ onSelectLandmark }: CivilRightsTimelineProps) {
  const [landmarks, setLandmarks] = useState<TimelineLandmark[]>([]);

  useEffect(() => {
    fetch("/data/civil-rights-landmarks.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        const parsed = data.features
          .map((f) => ({
            name: f.properties?.name as string,
            year: f.properties?.year as number,
            event: f.properties?.event as string,
            description: f.properties?.description as string,
            coordinates: (f.geometry as GeoJSON.Point).coordinates as [number, number],
          }))
          .sort((a, b) => a.year - b.year);
        setLandmarks(parsed);
      })
      .catch(() => {});
  }, []);

  if (landmarks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:overflow-x-auto sm:gap-3 pb-1">
      {landmarks.map((landmark) => (
        <button
          key={landmark.name}
          onClick={() => onSelectLandmark(landmark)}
          className="flex-shrink-0 rounded-lg border bg-card p-3 text-left transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 sm:w-[200px]"
        >
          <p className="text-lg font-bold" style={{ color: "#D4AF37" }}>
            {landmark.year}
          </p>
          <p className="text-sm font-medium leading-tight">{landmark.event}</p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{landmark.name}</p>
        </button>
      ))}
    </div>
  );
}
