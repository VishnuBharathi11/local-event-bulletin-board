const express = require('express')
const { authenticate } = require('../middleware/authMiddleware')
const { generateEventDescription } = require('../controllers/aiController')

const router = express.Router()

router.post('/ai/event-description', authenticate, generateEventDescription)

module.exports = router
