const https = require('https');

/**
 * Resolves latitude and longitude to a district using Google Geocoding API.
 */
async function getDistrictFromCoords(lat, lng) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_GEOCODING_API_KEY is not configured.');
    return null;
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
            return resolve(null);
          }

          // Robust extraction for Indian administrative structures
          let adminAreaL2 = null; // District (e.g., Coimbatore)
          let adminAreaL3 = null; // Sub-district/Taluk (e.g., Coimbatore South)
          let locality = null;    // City/Town (e.g., Coimbatore)

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
          // We iterate ALL results to find the most appropriate administrative district
          for (const result of json.results) {
            for (const component of result.address_components) {
              const types = component.types;
              const name = component.long_name;

              if (isInvalidName(name)) continue;

              // Priority 1: District (Standard for India)
              if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                adminAreaL2 = name;
              }
              // Priority 2: Locality (City/Town)
              if (!locality && types.includes('locality')) {
                locality = name;
              }
              // Priority 3: Sub-district/Taluk
              if (!adminAreaL3 && types.includes('administrative_area_level_3')) {
                adminAreaL3 = name;
              }
            }
          }

          console.log('DISTRICT RESOLUTION CANDIDATES:', { adminAreaL2, locality, adminAreaL3 });

          // STRICT RESOLUTION:
          // We MUST prefer the administrative district (L2) to ensure district-wide filtering.
          // Using a locality (like Mayileripalayam) as a district filter is incorrect.
          let resolvedDistrict = adminAreaL2 || locality || adminAreaL3;

          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }

          // FINAL FALLBACK: If everything failed, take the first available valid locality-like component from the first result
          if (!resolvedDistrict && json.results[0]) {
             const fallback = json.results[0].address_components.find(c =>
               !isInvalidName(c.long_name) && (c.types.includes('locality') || c.types.includes('administrative_area_level_2'))
             );
             if (fallback) resolvedDistrict = fallback.long_name;
          }

          if (resolvedDistrict && isInvalidName(resolvedDistrict)) {
            resolvedDistrict = null;
          }

          console.log('FINAL RESOLVED DISTRICT:', resolvedDistrict);
          resolve(resolvedDistrict);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

module.exports = { getDistrictFromCoords };
