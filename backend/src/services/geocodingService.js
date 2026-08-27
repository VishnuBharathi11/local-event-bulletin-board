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
    console.error('CRITICAL: GOOGLE_GEOCODING_API_KEY is missing from process.env');
    return {
      district: null,
      locality: null,
      error: 'Backend API Key missing'
    };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          console.log('GOOGLE API STATUS:', json.status);
          if (json.error_message) console.error('GOOGLE API ERROR_MESSAGE:', json.error_message);

          if (json.status !== 'OK') {
            return resolve({
              district: null,
              locality: null,
              error: `Google API Error: ${json.status}`,
              raw: json
            });
          }

          // Address component extraction
          let adminAreaL2 = null; // Official District
          let locality = null;    // City/Town
          let subLocality = null; // Village/Area
          let adminAreaL1 = null; // State

          const isInvalidName = (name) => {
            if (!name) return true;
            const normalized = name.toLowerCase().trim();
            return normalized.length === 0 ||
                   normalized.includes('[no name]') ||
                   normalized.includes('unnamed') ||
                   normalized.includes('unknown') ||
                   normalized === 'undefined' ||
                   normalized === 'null';
          };

          // We'll collect all valid components across all results for deep inspection
          const allComponents = [];

          if (json.results && Array.isArray(json.results)) {
            json.results.forEach((result, rIdx) => {
              result.address_components.forEach((component) => {
                const types = component.types;
                const name = component.long_name;

                if (isInvalidName(name)) return;

                allComponents.push({ name, types, rIdx });

                // Identify components
                if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                  adminAreaL2 = name;
                }
                if (!locality && types.includes('locality')) {
                  locality = name;
                }
                if (!subLocality && (types.includes('sublocality') || types.includes('neighborhood') || types.includes('sublocality_level_1'))) {
                  subLocality = name;
                }
                if (!adminAreaL1 && types.includes('administrative_area_level_1')) {
                  adminAreaL1 = name;
                }
              });
            });
          }

          console.log('DETECTION CANDIDATES:', { adminAreaL2, locality, subLocality, adminAreaL1 });

          // RESOLUTION LOGIC:
          // 1. Primary: Administrative Area Level 2 (Standard for "District")
          let resolvedDistrict = adminAreaL2;

          // 2. Fallback: If L2 is missing, but we have a Locality (City) that is DIFFERENT
          // from the Sublocality (Village), then the Locality might be the parent district/city.
          if (!resolvedDistrict && locality && subLocality && locality !== subLocality) {
            resolvedDistrict = locality;
            console.log('FALLBACK: Using Locality as District because Sublocality is present');
          }

          // 3. Last Resort: If still missing, just use Locality if it exists.
          if (!resolvedDistrict && locality) {
            resolvedDistrict = locality;
            console.log('FALLBACK: Using Locality as District (last resort)');
          }

          // LOCALITY resolution for display
          let resolvedLocality = subLocality || locality;

          // CLEANUP
          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }
          if (resolvedLocality) {
            resolvedLocality = resolvedLocality.replace(/\s+(City|Town|Village)$/i, '').trim();
          }

          console.log('FINAL RESOLVED:', { district: resolvedDistrict, locality: resolvedLocality });
          console.log('--- PHASE 1 DEBUG: BACKEND END ---');

          resolve({
            district: resolvedDistrict,
            locality: resolvedLocality,
            raw: json,
            debug: { candidates: { adminAreaL2, locality, subLocality, adminAreaL1 }, allComponents }
          });
        } catch (e) {
          console.error('PHASE 1 BACKEND JSON ERROR:', e);
          resolve({ district: null, locality: null, error: 'JSON Parse Error' });
        }
      });
    }).on('error', (e) => {
      console.error('PHASE 1 BACKEND HTTPS ERROR:', e);
      resolve({ district: null, locality: null, error: `HTTPS error: ${e.message}` });
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
