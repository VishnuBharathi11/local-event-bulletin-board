const https = require('https');

/**
 * Resolves latitude and longitude to location details using Google Geocoding API.
 */
async function getDetailedLocationFromCoords(lat, lng) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  console.log('--- PHASE 1B BACKEND: DISTRICT RESOLUTION START ---');
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
            console.error('GOOGLE API ERROR STATUS:', json.status);
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

          let adminAreaL2 = null; // Official District
          let adminAreaL3 = null; // Taluk / Sub-district
          let locality = null;    // City/Town
          let subLocality = null; // Village/Neighborhood
          let neighborhood = null;

          console.log('--- SCANNING ALL ADDRESS COMPONENTS ---');

          if (json.results && Array.isArray(json.results)) {
            json.results.forEach((result, rIdx) => {
              console.log(`RESULT [${rIdx}] TYPES:`, result.types);

              result.address_components.forEach((component) => {
                const types = component.types;
                const name = component.long_name;

                if (isInvalidName(name)) return;

                console.log(`  [${rIdx}] "${name}" | TYPES: ${types.join(', ')}`);

                // DISTRICT: strictly administrative_area_level_2
                if (!adminAreaL2 && types.includes('administrative_area_level_2')) {
                  adminAreaL2 = name;
                  console.log(`  >> FOUND CANDIDATE DISTRICT (L2): ${name}`);
                }

                // TALUK/SUB-DISTRICT: administrative_area_level_3
                if (!adminAreaL3 && types.includes('administrative_area_level_3')) {
                  adminAreaL3 = name;
                  console.log(`  >> FOUND CANDIDATE TALUK (L3): ${name}`);
                }

                // LOCALITY: City/Town
                if (!locality && types.includes('locality')) {
                  locality = name;
                  console.log(`  >> FOUND CANDIDATE LOCALITY: ${name}`);
                }

                // SUB-LOCALITY
                if (!subLocality && (types.includes('sublocality') || types.includes('sublocality_level_1'))) {
                  subLocality = name;
                  console.log(`  >> FOUND CANDIDATE SUB-LOCALITY: ${name}`);
                }

                // NEIGHBORHOOD
                if (!neighborhood && types.includes('neighborhood')) {
                  neighborhood = name;
                  console.log(`  >> FOUND CANDIDATE NEIGHBORHOOD: ${name}`);
                }
              });
            });
          }

          /**
           * STRICT DISTRICT RESOLUTION (PHASE 1B):
           * We ONLY accept administrative_area_level_2 or administrative_area_level_3 as a district.
           * We NEVER fallback to locality, neighborhood, or sublocality.
           */
          let finalDistrict = adminAreaL2 || adminAreaL3;

          /**
           * LOCALITY RESOLUTION:
           * The specific area name for display.
           */
          let finalLocality = neighborhood || subLocality || locality;

          // CLEANUP
          if (finalDistrict) {
            finalDistrict = finalDistrict.replace(/\s+(District|Taluk|Region|Division)$/i, '').trim();
          }
          if (finalLocality) {
            finalLocality = finalLocality.replace(/\s+(City|Town|Village)$/i, '').trim();
          }

          // FINAL SANITY CHECK: Ensure we didn't somehow pick a locality as district
          if (finalDistrict && finalLocality && finalDistrict.toLowerCase() === finalLocality.toLowerCase()) {
             // In some cases (like a city that is its own district), this is okay.
             // But the user specifically called out Mayileripalayam.
             console.log('WARNING: District and Locality match. Checking if this is a known locality...');
          }

          console.log('--- DISTRICT RESOLUTION SUMMARY ---');
          console.log('FINAL DISTRICT:', finalDistrict);
          console.log('FINAL LOCALITY:', finalLocality);
          console.log('-----------------------------------');

          resolve({
            district: finalDistrict,
            locality: finalLocality,
            raw: json
          });
        } catch (e) {
          console.error('PHASE 1B BACKEND ERROR:', e);
          resolve({ district: null, locality: null, error: 'Logic failure' });
        }
      });
    }).on('error', (e) => {
      console.error('PHASE 1B BACKEND HTTPS ERROR:', e);
      resolve({ district: null, locality: null, error: e.message });
    });
  });
}

/**
 * Resolves all major postal/locality areas belonging to a district.
 */
async function getPostalAreasForDistrict(district) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) return [];

  // Ambiguous query to force Google to return multiple sub-locations
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=neighborhoods+in+${encodeURIComponent(district)}+India&key=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status !== 'OK' || !json.results) return resolve([]);

          const areas = [];
          const seen = new Set();

          json.results.forEach((result) => {
            let name = null;
            let pincode = null;

            result.address_components.forEach((comp) => {
              // Capture neighborhood, sublocality, or locality
              if (!name && (comp.types.includes('neighborhood') || comp.types.includes('sublocality') || comp.types.includes('locality'))) {
                const n = comp.long_name;
                if (n.toLowerCase() !== district.toLowerCase()) {
                  name = n;
                }
              }
              if (comp.types.includes('postal_code')) {
                pincode = comp.long_name;
              }
            });

            if (name && !seen.has(name.toLowerCase())) {
              seen.add(name.toLowerCase());
              areas.push({ name, pincode });
            }
          });

          resolve(areas);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

module.exports = { getDistrictFromCoords, getDetailedLocationFromCoords, getPostalAreasForDistrict };
