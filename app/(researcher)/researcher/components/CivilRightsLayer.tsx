"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MapLineLayer,
  MapMarker,
  MapPopup,
  type MapViewport,
  MarkerContent,
} from "@/components/ui/map";

interface CivilRightsLandmark {
  name: string;
  year: number;
  event: string;
  description: string;
  coordinates: [number, number];
}

interface CivilRightsLayerProps {
  setViewport: (viewport: MapViewport | ((prev: MapViewport) => MapViewport)) => void;
}

export function CivilRightsLayer({ setViewport }: CivilRightsLayerProps) {
  const [visible, setVisible] = useState(true);
  const [landmarks, setLandmarks] = useState<CivilRightsLandmark[]>([]);
  const [routes, setRoutes] = useState<GeoJSON.FeatureCollection | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<CivilRightsLandmark | null>(null);

  useEffect(() => {
    fetch("/data/civil-rights-landmarks.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        const parsed = data.features.map((f) => ({
          name: f.properties?.name as string,
          year: f.properties?.year as number,
          event: f.properties?.event as string,
          description: f.properties?.description as string,
          coordinates: (f.geometry as GeoJSON.Point).coordinates as [number, number],
        }));
        setLandmarks(parsed);
      })
      .catch(() => {});

    fetch("/data/civil-rights-routes.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => setRoutes(data))
      .catch(() => {});
  }, []);

  useCopilotReadable({
    description: "Civil rights landmarks and march routes on the researcher map",
    value: landmarks.map((l) => ({
      name: l.name,
      year: l.year,
      coordinates: l.coordinates,
    })),
  });

  const flyToLandmark = useCallback(
    (name: string) => {
      const landmark = landmarks.find((l) => l.name.toLowerCase().includes(name.toLowerCase()));
      if (landmark) {
        setViewport((prev) => ({
          ...prev,
          center: landmark.coordinates,
          zoom: 15,
        }));
        setSelectedLandmark(landmark);
      }
    },
    [landmarks, setViewport],
  );

  useCopilotAction({
    name: "fly_to_civil_rights_landmark",
    description: "Pan the map to a named civil rights landmark",
    parameters: [
      {
        name: "landmarkName",
        type: "string",
        description: "The name of the civil rights landmark to fly to",
        required: true,
      },
    ],
    handler: ({ landmarkName }) => {
      flyToLandmark(landmarkName);
      return `Panned to ${landmarkName}`;
    },
  });

  return (
    <>
      <div className="absolute top-2 left-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVisible((v) => !v)}
          data-tour-step-id="researcher-civil-rights"
          className="bg-background/90 backdrop-blur-sm text-xs"
        >
          {visible ? "Hide History" : "Show History"}
        </Button>
      </div>

      {visible && (
        <>
          {landmarks.map((landmark) => (
            <MapMarker
              key={landmark.name}
              longitude={landmark.coordinates[0]}
              latitude={landmark.coordinates[1]}
              onClick={() => setSelectedLandmark(landmark)}
            >
              <MarkerContent>
                <div
                  className="size-4 rounded-full border-2 border-white shadow-lg cursor-pointer"
                  style={{ background: "#D4AF37" }}
                />
              </MarkerContent>
            </MapMarker>
          ))}

          {selectedLandmark && (
            <MapPopup
              key={selectedLandmark.name}
              longitude={selectedLandmark.coordinates[0]}
              latitude={selectedLandmark.coordinates[1]}
              onClose={() => setSelectedLandmark(null)}
              closeOnClick={false}
              focusAfterOpen={false}
              closeButton
            >
              <div className="space-y-1 p-1 max-w-[260px]">
                <p className="text-xs font-semibold" style={{ color: "#D4AF37" }}>
                  {selectedLandmark.year}
                </p>
                <p className="text-sm font-medium">{selectedLandmark.name}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {selectedLandmark.event}
                </p>
                <p className="text-xs text-muted-foreground">{selectedLandmark.description}</p>
              </div>
            </MapPopup>
          )}

          {routes && (
            <MapLineLayer
              id="civil-rights-routes"
              data={routes}
              color="#D4AF37"
              width={3}
              opacity={0.8}
            />
          )}
        </>
      )}
    </>
  );
}
