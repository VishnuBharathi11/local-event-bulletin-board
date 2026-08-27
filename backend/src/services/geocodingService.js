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

          // Robust extraction for Indian districts and metropolitan areas
          let district = null;
          let locality = null;
          let adminAreaL2 = null;

          for (const result of json.results) {
            for (const component of result.address_components) {
              if (component.types.includes('administrative_area_level_2')) {
                adminAreaL2 = component.long_name;
              }
              if (component.types.includes('locality')) {
                locality = component.long_name;
              }
            }
            if (adminAreaL2) break;
          }

          // Priority: District (L2) -> Locality
          district = adminAreaL2 || locality;

          // Clean up "District" suffix if present to match typical event data
          if (district) {
            district = district.replace(/\s+District$/i, '');
          }

          resolve(district);
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
