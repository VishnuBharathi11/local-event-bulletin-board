const https = require('https');

/**
 * Resolves latitude and longitude to location details using Google Geocoding API.
 * Returns an object with district, locality, and the full raw response for debugging.
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
            return resolve({ district: null, locality: null, raw: json });
          }

          console.log('--- START GOOGLE GEOCODING DEBUG ---');
          console.log('COORDINATES:', { lat, lng });

          let adminAreaL2 = null; // Usually District (e.g., Coimbatore)
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

          // Iterate through all results and all address components
          // We log each one to help the user identify the correct field
          json.results.forEach((result, rIdx) => {
            console.log(`RESULT [${rIdx}] TYPES:`, result.types);
            result.address_components.forEach((component) => {
              const types = component.types;
              const name = component.long_name;

              if (isInvalidName(name)) return;

              console.log(`  COMPONENT: "${name}" | TYPES: ${types.join(', ')}`);

              // DISTRICT: In India, administrative_area_level_2 is the official District.
              if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                adminAreaL2 = name;
              }

              // LOCALITY: City/Town
              if (!locality && types.includes('locality')) {
                locality = name;
              }

              // SUB-LOCALITY: Village/Neighborhood/Area
              if (!subLocality && (types.includes('sublocality_level_1') || types.includes('neighborhood') || types.includes('sublocality'))) {
                subLocality = name;
              }
            });
          });

          // DISTRICT RESOLUTION:
          // We strictly resolve District from Level 2.
          let resolvedDistrict = adminAreaL2;

          // LOCALITY RESOLUTION:
          let resolvedLocality = locality || subLocality;

          // CLEANUP
          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }
          if (resolvedLocality) {
            resolvedLocality = resolvedLocality.replace(/\s+(City|Town|Village)$/i, '').trim();
          }

          console.log('FINAL RESOLVED VALUES:', { district: resolvedDistrict, locality: resolvedLocality });
          console.log('--- END GOOGLE GEOCODING DEBUG ---');

          // We return the raw json as well so the frontend can log it
          resolve({ district: resolvedDistrict, locality: resolvedLocality, raw: json });
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
