const https = require('https');

/**
 * Resolves latitude and longitude to location details using Google Geocoding API.
 * Returns an object with district and locality.
 */
async function getDetailedLocationFromCoords(lat, lng) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_GEOCODING_API_KEY is not configured.');
    return { district: null, locality: null };
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
            console.error('Geocoding API error:', json.status, json.error_message);
            return resolve({ district: null, locality: null });
          }

          console.log('--- START GOOGLE GEOCODING DEBUG ---');
          console.log('COORDINATES:', { lat, lng });

          // Robust extraction for Indian administrative structures
          let adminAreaL2 = null; // Usually District (e.g., Coimbatore)
          let adminAreaL1 = null; // State (e.g., Tamil Nadu)
          let locality = null;    // City/Town (e.g., Coimbatore)
          let subLocality = null; // Village/Neighborhood (e.g., Mayileripalayam)

          const isInvalidName = (name) => {
            if (!name) return true;
            const normalized = name.toLowerCase().trim();
            return normalized.includes('[no name]') ||
                   normalized.includes('unnamed') ||
                   normalized.includes('unknown') ||
                   normalized === 'undefined' ||
                   normalized === 'null';
          };

          // Iterate through all results to find the most appropriate administrative labels
          for (const result of json.results) {
            for (const component of result.address_components) {
              const types = component.types;
              const name = component.long_name;

              if (isInvalidName(name)) continue;

              // DISTRICT: In India, administrative_area_level_2 is the official District.
              if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                adminAreaL2 = name;
                console.log('FOUND DISTRICT (L2):', name);
              }

              // STATE: administrative_area_level_1
              if (!adminAreaL1 && types.includes('administrative_area_level_1')) {
                adminAreaL1 = name;
                console.log('FOUND STATE (L1):', name);
              }

              // LOCALITY: City/Town
              if (!locality && types.includes('locality')) {
                locality = name;
                console.log('FOUND LOCALITY:', name);
              }

              // SUB-LOCALITY: Village/Neighborhood/Area
              if (!subLocality && (types.includes('sublocality_level_1') || types.includes('neighborhood'))) {
                subLocality = name;
                console.log('FOUND SUB-LOCALITY:', name);
              }
            }
          }

          // DISTRICT RESOLUTION:
          // We MUST resolve the actual district.
          // If L2 is found, that is our district.
          let resolvedDistrict = adminAreaL2;

          // LOCALITY RESOLUTION:
          // For the locality display/filter, prefer the town/city name, then the village.
          let resolvedLocality = locality || subLocality;

          // CLEANUP: Remove suffixes like "District" or "Taluk" for cleaner display/matching
          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }
          if (resolvedLocality) {
            resolvedLocality = resolvedLocality.replace(/\s+(City|Town|Village)$/i, '').trim();
          }

          console.log('FINAL RESOLVED VALUES:', { district: resolvedDistrict, locality: resolvedLocality });
          console.log('--- END GOOGLE GEOCODING DEBUG ---');

          resolve({ district: resolvedDistrict, locality: resolvedLocality });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => {
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
