const express = require('express');
const { getDistrictFromCoords } = require('../services/geocodingService');

const router = express.Router();

router.get('/district', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  try {
    const district = await getDistrictFromCoords(lat, lng);
    return res.json({ district });
  } catch (error) {
    console.error('Failed to resolve district:', error);
    return res.status(500).json({ error: 'Failed to resolve location information.' });
  }
});

module.exports = router;
