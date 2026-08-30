const express = require('express');
const { getDetailedLocationFromCoords, getPostalAreasForDistrict } = require('../services/geocodingService');
const { searchLocations } = require('../services/locationSearchService');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const suggestions = await searchLocations(req.query.q);
    return res.json({ suggestions });
  } catch (error) {
    if (error?.code === 'LOCATION_QUERY_INVALID'
      || error?.code === 'LOCATION_QUERY_TOO_SHORT'
      || error?.code === 'LOCATION_QUERY_TOO_LONG') {
      return res.status(400).json({ error: error.message });
    }

    if (error?.code === 'LOCATION_PROVIDER_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Location search is temporarily unavailable. Please enter the venue manually.' });
    }

    console.error('Failed to search locations:', error?.code || error?.message || error);
    return res.status(502).json({ error: 'Unable to search locations right now. Please enter the venue manually.' });
  }
});

router.get('/district', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  try {
    const result = await getDetailedLocationFromCoords(lat, lng);
    // Returning district, locality, and raw geocoding data for Phase 1 debugging
    return res.json(result);
  } catch (error) {
    console.error('Failed to resolve location details:', error);
    return res.status(500).json({ error: 'Failed to resolve location information.' });
  }
});

router.get('/localities', async (req, res) => {
  const { district } = req.query;

  if (!district) {
    return res.status(400).json({ error: 'District is required.' });
  }

  try {
    const areas = await getPostalAreasForDistrict(district);
    return res.json({ localities: areas });
  } catch (error) {
    console.error('Failed to resolve localities:', error);
    return res.status(500).json({ error: 'Failed to resolve locality information.' });
  }
});

module.exports = router;
