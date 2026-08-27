const https = require('https');

/**
 * Resolves latitude and longitude to location details using Google Geocoding API.
 */
async function getDetailedLocationFromCoords(lat, lng) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  console.log('--- PHASE 1 DEBUG: BACKEND START ---');
  console.log('COORDINATES:', { lat, lng });

  if (!apiKey) {
    console.error('CRITICAL: GOOGLE_GEOCODING_API_KEY is missing');
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

          if (json.status !== 'OK') {
            console.error('Geocoding API error:', json.status, json.error_message || '');
            return resolve({ district: null, locality: null, error: json.status, raw: json });
          }

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

          const allComponents = [];
          const admin2Set = new Set();
          const admin3Set = new Set();
          const localitySet = new Set();
          const sublocalitySet = new Set();
          const neighborhoodSet = new Set();

          // We iterate through ALL results to find all potential administrative levels
          json.results.forEach((result, rIdx) => {
            result.address_components.forEach((component) => {
              const types = component.types;
              const name = component.long_name;

              if (isInvalidName(name)) return;

              allComponents.push({ name, types, rIdx });

              if (types.includes('administrative_area_level_2')) admin2Set.add(name);
              if (types.includes('administrative_area_level_3')) admin3Set.add(name);
              if (types.includes('locality')) localitySet.add(name);
              if (types.includes('sublocality') || types.includes('sublocality_level_1')) sublocalitySet.add(name);
              if (types.includes('neighborhood')) neighborhoodSet.add(name);
            });
          });

          // Convert sets to arrays (preserving order of discovery which is specificity)
          const admin2List = Array.from(admin2Set);
          const admin3List = Array.from(admin3Set);
          const localityList = Array.from(localitySet);
          const sublocalityList = Array.from(sublocalitySet);
          const neighborhoodList = Array.from(neighborhoodSet);

          console.log('--- EXTRACTED CANDIDATES ---');
          console.log('Admin L2 (Districts):', admin2List);
          console.log('Admin L3 (Taluks):', admin3List);
          console.log('Localities (Cities):', localityList);
          console.log('Sublocalities:', sublocalityList);
          console.log('Neighborhoods:', neighborhoodList);

          /**
           * DISTRICT RESOLUTION STRATEGY (STRICT):
           * 1. Primary: administrative_area_level_2 (Standard District)
           * 2. Secondary: administrative_area_level_3 (Often Taluk, sometimes used for District in rural areas)
           * 3. Fallback (Multi-Locality): If L2/L3 are missing but we have multiple distinct Localities,
           *    the BROADEST locality (the one appearing in later, broader results) is often the District/Major City.
           */
          let resolvedDistrict = null;

          if (admin2List.length > 0) {
            resolvedDistrict = admin2List[0];
            console.log('STRATEGY 1: Using Administrative Area Level 2 as District');
          } else if (admin3List.length > 0) {
            resolvedDistrict = admin3List[0];
            console.log('STRATEGY 2: Using Administrative Area Level 3 as District');
          } else if (localityList.length > 1) {
            // If Result 0 has locality "Mayileripalayam" and Result 1 has locality "Coimbatore"
            // We take the broadest one (last in list)
            resolvedDistrict = localityList[localityList.length - 1];
            console.log('STRATEGY 3: Using Broadest Locality as District (Multi-locality detected)');
          }

          /**
           * LOCALITY RESOLUTION STRATEGY:
           * The most specific valid locality name for display.
           */
          let resolvedLocality = localityList[0] || sublocalityList[0] || neighborhoodList[0];

          // FINAL VALIDATION: If resolvedDistrict is exactly the same as a known more specific locality,
          // it might mean we've incorrectly picked the same name.
          // But the user specifically said NOT to use Mayileripalayam as district.
          // If Coimbatore is the only thing found, Strategy 3 won't trigger if it's the only locality.

          // CLEANUP
          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }
          if (resolvedLocality) {
            resolvedLocality = resolvedLocality.replace(/\s+(City|Town|Village)$/i, '').trim();
          }

          // If resolvedDistrict is still null, we return null so the UI shows "Unable to determine"
          // instead of incorrectly showing a village name.

          console.log('FINAL RESOLUTION:', { district: resolvedDistrict, locality: resolvedLocality });
          console.log('--- PHASE 1 DEBUG: BACKEND END ---');

          resolve({
            district: resolvedDistrict,
            locality: resolvedLocality,
            debug: { admin2List, admin3List, localityList, sublocalityList, neighborhoodList, allComponents },
            raw: json
          });
        } catch (e) {
          console.error('PHASE 1 BACKEND ERROR:', e);
          resolve({ district: null, locality: null, error: 'Parse Error' });
        }
      });
    }).on('error', (e) => {
      console.error('PHASE 1 BACKEND HTTP ERROR:', e);
      resolve({ district: null, locality: null, error: e.message });
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
