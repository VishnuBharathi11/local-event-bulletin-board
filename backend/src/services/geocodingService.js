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

          // Extract administrative_area_level_2 (District in India)
          let district = null;
          for (const result of json.results) {
            const component = result.address_components.find(c =>
              c.types.includes('administrative_area_level_2')
            );
            if (component) {
              district = component.long_name;
              break;
            }
          }

          // Fallback to administrative_area_level_1 (State) if district not found?
          // The requirement specifically mentions "district".

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
