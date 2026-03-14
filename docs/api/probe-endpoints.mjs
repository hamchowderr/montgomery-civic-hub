// Probe all 29 ArcGIS endpoints for Montgomery Civic Hub
// Fetches metadata, record count, and sample record for each endpoint

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'endpoints');

const ENDPOINTS = {
  serviceRequests311: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Received_311_Service_Request/FeatureServer/0',
  businessLicense: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Business_License/FeatureServer/0',
  constructionPermits: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Construction_Permits/FeatureServer/0',
  codeViolations: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Code_Violations/FeatureServer/0',
  pavingProject: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Paving_Project/FeatureServer/0',
  policeFacilities: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Police_Facilities/FeatureServer/0',
  fireStations: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Fire_Stations/FeatureServer/0',
  communityCenters: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Community_Centers/FeatureServer/0',
  libraries: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Libraries/FeatureServer/0',
  educationFacilities: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Education_Facilities/FeatureServer/0',
  daycareCenters: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Daycare_Centers/FeatureServer/0',
  nuisance: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Nuisance/FeatureServer/0',
  tornadoSirens: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Tornado_Sirens/FeatureServer/0',
  cityOwnedProperties: 'https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/City_Owned_Properities/FeatureServer/0',
  pavementAssessment: 'https://gis.montgomeryal.gov/server/rest/services/PublicWorks/Pavement_Assessment_2025/MapServer/0',
  healthCare: 'https://gis.montgomeryal.gov/server/rest/services/Health_Care_Facility/MapServer/0',
  entertainmentDistricts: 'https://gis.montgomeryal.gov/server/rest/services/OneView/Entertainment_Districts/FeatureServer/0',
  recyclingLocations: 'https://gis.montgomeryal.gov/server/rest/services/QAlert/QAlert_311/MapServer/4',
  garbageSchedule: 'https://gis.montgomeryal.gov/server/rest/services/QAlert/QAlert_311/MapServer/5',
  curbsideTrash: 'https://gis.montgomeryal.gov/server/rest/services/QAlert/QAlert_311/MapServer/7',
  councilDistricts: 'https://gis.montgomeryal.gov/server/rest/services/SDE_City_Council/MapServer/0',
  neighborhoods: 'https://gis.montgomeryal.gov/server/rest/services/NSD_Neighborhoods/FeatureServer/0',
  censusTract: 'https://gis.montgomeryal.gov/server/rest/services/Census_Boundaries/MapServer/0',
  censusBlockGroup: 'https://gis.montgomeryal.gov/server/rest/services/Census_Boundaries/MapServer/1',
  censusBlock: 'https://gis.montgomeryal.gov/server/rest/services/Census_Boundaries/MapServer/2',
  cityParks: 'https://gis.montgomeryal.gov/server/rest/services/OneView/City_Parks/MapServer/7',
  zoning: 'https://gis.montgomeryal.gov/server/rest/services/Zoning/FeatureServer/0',
  floodHazardAreas: 'https://gis.montgomeryal.gov/server/rest/services/OneView/Flood_Hazard_Areas/FeatureServer/0',
};

const BATCH_SIZE = 5;
const TIMEOUT_MS = 30000;

async function fetchJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function probeEndpoint(key, url) {
  console.log(`  Probing ${key}...`);
  const result = {
    key,
    url,
    geometryType: null,
    maxRecordCount: null,
    totalRecords: null,
    fields: [],
    sampleRecord: null,
    probedAt: new Date().toISOString(),
    error: null,
  };

  try {
    // 1. Metadata
    const meta = await fetchJSON(`${url}?f=json`);
    if (meta.error) {
      result.error = meta.error;
      return result;
    }
    result.geometryType = meta.geometryType || null;
    result.maxRecordCount = meta.maxRecordCount || null;

    // Extract fields from metadata
    const metaFields = (meta.fields || []).map(f => ({
      name: f.name,
      type: f.type,
      alias: f.alias || f.name,
      length: f.length || null,
      sampleValue: null,
    }));

    // 2. Record count
    try {
      const countData = await fetchJSON(`${url}/query?where=1%3D1&returnCountOnly=true&f=json`);
      result.totalRecords = countData.count ?? null;
    } catch (e) {
      console.log(`    Count query failed for ${key}: ${e.message}`);
    }

    // 3. Sample record
    try {
      const sampleData = await fetchJSON(`${url}/query?where=1%3D1&outFields=*&resultRecordCount=1&f=json`);
      if (sampleData.features && sampleData.features.length > 0) {
        const feature = sampleData.features[0];
        result.sampleRecord = feature.attributes || null;

        // Enrich fields with sample values
        if (result.sampleRecord) {
          for (const field of metaFields) {
            if (field.name in result.sampleRecord) {
              field.sampleValue = result.sampleRecord[field.name];
            }
          }
        }
      }
    } catch (e) {
      console.log(`    Sample query failed for ${key}: ${e.message}`);
    }

    result.fields = metaFields;
  } catch (e) {
    result.error = e.message;
    console.log(`    ERROR for ${key}: ${e.message}`);
  }

  return result;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const entries = Object.entries(ENDPOINTS);
  console.log(`Probing ${entries.length} endpoints in batches of ${BATCH_SIZE}...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`Batch ${batchNum} (${batch.map(([k]) => k).join(', ')})`);

    const results = await Promise.all(
      batch.map(([key, url]) => probeEndpoint(key, url))
    );

    for (const result of results) {
      const outPath = join(OUT_DIR, `${result.key}.json`);
      await writeFile(outPath, JSON.stringify(result, null, 2));
      if (result.error) {
        errorCount++;
        console.log(`    ✗ ${result.key}: ${typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}`);
      } else {
        successCount++;
        console.log(`    ✓ ${result.key}: ${result.totalRecords ?? '?'} records, ${result.fields.length} fields`);
      }
    }
    console.log();
  }

  console.log(`Done. ${successCount} succeeded, ${errorCount} failed.`);
  console.log(`Results written to ${OUT_DIR}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
