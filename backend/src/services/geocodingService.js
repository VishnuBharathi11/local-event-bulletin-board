const https = require('https');

/**
 * Resolves latitude and longitude to location details using Google Geocoding API.
 */
async function getDetailedLocationFromCoords(lat, lng) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  console.log('--- PHASE 1 DEBUG: BACKEND START ---');
  console.log('COORDINATES RECEIVED:', { lat, lng });
  console.log('API KEY PRESENT:', !!apiKey);

  if (!apiKey) {
    return {
      district: null,
      locality: null,
      error: 'GOOGLE_GEOCODING_API_KEY is missing in backend .env'
    };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  console.log('REQUESTING URL:', `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey.substring(0, 5)}***`);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          console.log('GOOGLE API STATUS:', json.status);
          if (json.error_message) console.log('GOOGLE API ERROR:', json.error_message);

          if (json.status !== 'OK') {
            return resolve({
              district: null,
              locality: null,
              error: `Google API Error: ${json.status}`,
              raw: json
            });
          }

          let adminAreaL2 = null; // District
          let locality = null;    // City
          let subLocality = null; // Village/Neighborhood

          const allFoundComponents = [];

          const isInvalidName = (name) => {
            if (!name) return true;
            const normalized = name.toLowerCase().trim();
            return normalized.includes('[no name]') ||
                   normalized.includes('unnamed') ||
                   normalized.includes('unknown') ||
                   normalized === 'undefined' ||
                   normalized === 'null';
          };

          // Deep extraction from all results
          if (json.results && Array.isArray(json.results)) {
            json.results.forEach((result) => {
              if (result.address_components && Array.isArray(result.address_components)) {
                result.address_components.forEach((component) => {
                  const types = component.types;
                  const name = component.long_name;

                  if (isInvalidName(name)) return;

                  allFoundComponents.push({ name, types });

                  // DISTRICT: administrative_area_level_2
                  if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                    adminAreaL2 = name;
                    console.log('  >> MATCHED DISTRICT (L2):', name);
                  }

                  // LOCALITY: locality
                  if (!locality && types.includes('locality')) {
                    locality = name;
                    console.log('  >> MATCHED LOCALITY:', name);
                  }

                  // SUB-LOCALITY: neighborhood, sublocality, sublocality_level_1
                  if (!subLocality && (types.includes('neighborhood') || types.includes('sublocality') || types.includes('sublocality_level_1'))) {
                    subLocality = name;
                    console.log('  >> MATCHED SUB-LOCALITY:', name);
                  }
                });
              }
            });
          }

          let resolvedDistrict = adminAreaL2;
          let resolvedLocality = locality || subLocality;

          // CLEANUP
          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }
          if (resolvedLocality) {
            resolvedLocality = resolvedLocality.replace(/\s+(City|Town|Village)$/i, '').trim();
          }

          console.log('DEBUG: Resolved District:', resolvedDistrict);
          console.log('DEBUG: Resolved Locality:', resolvedLocality);
          console.log('--- PHASE 1 DEBUG: BACKEND END ---');

          resolve({
            district: resolvedDistrict,
            locality: resolvedLocality,
            allComponents: allFoundComponents,
            raw: json
          });
        } catch (e) {
          console.error('PHASE 1 BACKEND JSON ERROR:', e);
          resolve({ district: null, locality: null, error: 'Failed to parse Google response' });
        }
      });
    }).on('error', (e) => {
      console.error('PHASE 1 BACKEND HTTP ERROR:', e);
      resolve({ district: null, locality: null, error: `HTTP Request failed: ${e.message}` });
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
