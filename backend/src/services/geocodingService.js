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
          for (const result of json.results) {
            for (const component of result.address_components) {
              const types = component.types;
              const name = component.long_name;

              if (isInvalidName(name)) continue;

              if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                adminAreaL2 = name;
              }
              if (!adminAreaL3 && types.includes('administrative_area_level_3')) {
                adminAreaL3 = name;
              }
              if (!locality && types.includes('locality')) {
                locality = name;
              }
              if (!subLocality && types.includes('sublocality_level_1')) {
                subLocality = name;
              }
            }
          }

          // Priority for "District":
          // 1. administrative_area_level_2 is the standard for "District" in India.
          // 2. locality is a fallback for metropolitan cities where L2 might be missing or less useful.
          // 3. administrative_area_level_3 as a middle ground.
          let resolvedDistrict = adminAreaL2 || locality || adminAreaL3;

          if (resolvedDistrict) {
            resolvedDistrict = resolvedDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }

          // FINAL FALLBACK: If everything failed, take the first available valid locality-like component
          if (!resolvedDistrict && json.results[0]) {
             const fallback = json.results[0].address_components.find(c =>
               !isInvalidName(c.long_name) && (c.types.includes('locality') || c.types.includes('administrative_area_level_2'))
             );
             if (fallback) resolvedDistrict = fallback.long_name;
          }

          if (resolvedDistrict && isInvalidName(resolvedDistrict)) {
            resolvedDistrict = null;
          }

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
