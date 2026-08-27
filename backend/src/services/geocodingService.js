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

          // Robust extraction for Indian administrative structures
          let adminAreaL2 = null; // District (e.g., Coimbatore)
          let locality = null;    // City/Town (e.g., Coimbatore)
          let subLocality = null; // Neighborhood/Area

          const isInvalidName = (name) => {
            if (!name) return true;
            const normalized = name.toLowerCase().trim();
            return normalized.includes('[no name]') ||
                   normalized.includes('unnamed') ||
                   normalized.includes('unknown') ||
                   normalized === 'undefined' ||
                   normalized === 'null';
          };

          // Google Geocoding returns results from most specific to least specific
          console.log('FULL REVERSE-GEOCODING RESPONSE:', JSON.stringify(json, null, 2));

          for (const result of json.results) {
            console.log('RESULT ADDRESS COMPONENTS:', result.address_components);
            for (const component of result.address_components) {
              const types = component.types;
              const name = component.long_name;

              if (isInvalidName(name)) continue;

              // Priority 1: District (Standard for India - Administrative Area Level 2)
              if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                adminAreaL2 = name;
              }
              // Priority 2: Locality (City/Town)
              if (!locality && types.includes('locality')) {
                locality = name;
              }
              // Priority 3: Sub-locality (Neighborhood/Village)
              if (!subLocality && (types.includes('sublocality_level_1') || types.includes('neighborhood'))) {
                subLocality = name;
              }
            }
          }

          // DISTRICT ≠ CITY ≠ VILLAGE ≠ LOCALITY
          // We strictly resolve District from Level 2.
          let resolvedDistrict = adminAreaL2;

          // Locality can be the City/Town or a Sub-locality if locality is missing.
          let resolvedLocality = locality || subLocality;

          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }
          if (resolvedLocality) {
            resolvedLocality = resolvedLocality.replace(/\s+(City|Town|Village)$/i, '').trim();
          }

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
