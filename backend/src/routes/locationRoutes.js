const express = require('express');
const { getDetailedLocationFromCoords } = require('../services/geocodingService');

const router = express.Router();

router.get('/district', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  try {
    const { district, locality } = await getDetailedLocationFromCoords(lat, lng);
    return res.json({ district, locality });
  } catch (error) {
    console.error('Failed to resolve location details:', error);
    return res.status(500).json({ error: 'Failed to resolve location information.' });
  }
});

module.exports = router;
