const express = require('express')
const cors = require('cors')
const healthRoutes = require('./routes/healthRoutes')
const authRoutes = require('./routes/authRoutes')
const eventRoutes = require('./routes/eventRoutes')
const rsvpRoutes = require('./routes/rsvpRoutes')
const eventRequestRoutes = require('./routes/eventRequestRoutes')
const locationRoutes = require('./routes/locationRoutes')

function createApp() {
  const app = express()
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const corsOrigin = configuredOrigins.length > 0
    ? configuredOrigins
    : (process.env.NODE_ENV === 'production' ? false : true)

  app.use(cors({ origin: corsOrigin, credentials: true }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  app.use('/api', healthRoutes)
  app.use('/api', authRoutes)
  app.use('/api', eventRoutes)
  app.use('/api', rsvpRoutes)
  app.use('/api', eventRequestRoutes)
  app.use('/api/location', locationRoutes)

  return app
}

module.exports = { createApp }
// Cloud Run CI/CD deployment test
