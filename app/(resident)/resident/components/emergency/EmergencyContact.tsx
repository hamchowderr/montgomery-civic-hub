"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { CommunityResources } from "./CommunityResources";
import { EmergencyNumbers } from "./EmergencyNumbers";
import { FacilityFinder } from "./FacilityFinder";
import { ServiceDemandCharts } from "./ServiceDemandCharts";
import { EMERGENCY_NUMBERS } from "./types";
import { useEmergencyData } from "./useEmergencyData";

export function EmergencyContact() {
  const {
    sirenCount,
    policeFacilities,
    fireStations,
    healthCare,
    facilitiesLoading,
    districtDemand,
    statusBreakdown,
    statsLoading,
    resources,
    resourcesLoading,
    healthCareByType,
  } = useEmergencyData();

  useCopilotReadable({
    description:
      "Montgomery emergency contacts, facility counts, 311 demand stats, and community resource counts",
    value: {
      emergencyNumbers: EMERGENCY_NUMBERS,
      tornadoSirenCount: sirenCount,
      facilityCounts: {
        police: policeFacilities.length,
        fire: fireStations.length,
        medical: healthCare.length,
      },
      serviceRequestsByDistrict: districtDemand,
      serviceRequestsByStatus: statusBreakdown,
      communityResources: resources,
    },
  });

  return (
    <div data-tour-step-id="resident-emergency" className="space-y-6">
      <EmergencyNumbers sirenCount={sirenCount} />

      <FacilityFinder
        policeFacilities={policeFacilities}
        fireStations={fireStations}
        healthCare={healthCare}
        healthCareByType={healthCareByType}
        isLoading={facilitiesLoading}
      />

      <ServiceDemandCharts
        districtDemand={districtDemand}
        statusBreakdown={statusBreakdown}
        isLoading={statsLoading}
      />

      <CommunityResources resources={resources} isLoading={resourcesLoading} />
    </div>
  );
}
