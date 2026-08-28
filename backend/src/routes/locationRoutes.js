const express = require('express');
const { getDetailedLocationFromCoords, getPostalAreasForDistrict } = require('../services/geocodingService');

const router = express.Router();

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

router.get('/areas', async (req, res) => {
  const { district } = req.query;

  if (!district) {
    return res.status(400).json({ error: 'District is required.' });
  }

  try {
    const areas = await getPostalAreasForDistrict(district);
    return res.json({ areas });
  } catch (error) {
    console.error('Failed to resolve areas:', error);
    return res.status(500).json({ error: 'Failed to resolve area information.' });
  }
});

module.exports = router;
