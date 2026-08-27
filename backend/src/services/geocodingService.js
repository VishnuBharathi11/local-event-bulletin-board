const https = require('https');

/**
 * Resolves latitude and longitude to location details using Google Geocoding API.
 * Returns an object with district, locality, and the full raw response for debugging.
 */
async function getDetailedLocationFromCoords(lat, lng) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    console.error('PHASE 1 BACKEND: GOOGLE_GEOCODING_API_KEY IS MISSING');
    return { district: null, locality: null, error: 'API Key missing' };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          console.log('--- PHASE 1 BACKEND: GOOGLE API RESPONSE ---');
          console.log('STATUS:', json.status);
          if (json.error_message) console.log('ERROR MESSAGE:', json.error_message);

          if (json.status !== 'OK') {
            console.error('Geocoding API error:', json.status, json.error_message);
            return resolve({ district: null, locality: null, raw: json, error: json.status });
          }

          let adminAreaL2 = null; // District
          let locality = null;    // City/Town
          let subLocality = null; // Village/Neighborhood
          let adminAreaL1 = null; // State

          const isInvalidName = (name) => {
            if (!name) return true;
            const normalized = name.toLowerCase().trim();
            return normalized.includes('[no name]') ||
                   normalized.includes('unnamed') ||
                   normalized.includes('unknown') ||
                   normalized === 'undefined' ||
                   normalized === 'null';
          };

          // Iterate through all results
          json.results.forEach((result, rIdx) => {
            console.log(`RESULT [${rIdx}] TYPES:`, result.types.join(', '));

            result.address_components.forEach((component) => {
              const types = component.types;
              const name = component.long_name;

              if (isInvalidName(name)) return;

              // Log every component for identifying the correct one
              console.log(`  [${rIdx}] COMPONENT: "${name}" | TYPES: ${types.join(', ')}`);

              // DISTRICT: Prioritize Level 2
              if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                adminAreaL2 = name;
                console.log(`  >> IDENTIFIED AS DISTRICT: ${name}`);
              }

              // LOCALITY: City/Town
              if (!locality && types.includes('locality')) {
                locality = name;
                console.log(`  >> IDENTIFIED AS LOCALITY: ${name}`);
              }

              // SUB-LOCALITY: Village/Area
              if (!subLocality && (types.includes('sublocality') || types.includes('neighborhood'))) {
                subLocality = name;
                console.log(`  >> IDENTIFIED AS SUB-LOCALITY: ${name}`);
              }

              // STATE: Level 1
              if (!adminAreaL1 && types.includes('administrative_area_level_1')) {
                adminAreaL1 = name;
              }
            });
          });

          // FINAL RESOLUTION LOGIC
          let resolvedDistrict = adminAreaL2;
          let resolvedLocality = locality || subLocality;

          // If strictly missing L2, but we have a locality that is different from sublocality,
          // maybe locality IS the district-level city?
          // But for Coimbatore, L2 SHOULD exist.

          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }
          if (resolvedLocality) {
            resolvedLocality = resolvedLocality.replace(/\s+(City|Town|Village)$/i, '').trim();
          }

          console.log('--- PHASE 1 RESOLUTION SUMMARY ---');
          console.log('DISTRICT (L2):', resolvedDistrict);
          console.log('LOCALITY (City/Sub):', resolvedLocality);
          console.log('STATE (L1):', adminAreaL1);
          console.log('-----------------------------------');

          resolve({ district: resolvedDistrict, locality: resolvedLocality, raw: json });
        } catch (e) {
          console.error('PHASE 1 BACKEND: JSON PARSE ERROR', e);
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.error('PHASE 1 BACKEND: HTTPS REQUEST ERROR', e);
      reject(e);
    });
  });
}

/**
 * Legacy wrapper for single district string resolution.
 */
async function getDistrictFromCoords(lat, lng) {
  const { district } = await getDetailedLocationFromCoords(lat, lng);
  return district;
}

module.exports = { getDistrictFromCoords, getDetailedLocationFromCoords };
