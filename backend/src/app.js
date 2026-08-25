const express = require('express')
const cors = require('cors')
const healthRoutes = require('./routes/healthRoutes')
const eventRoutes = require('./routes/eventRoutes')

function createApp() {
  const app = express()
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use(cors({
    origin: configuredOrigins.length > 0 ? configuredOrigins : true,
  }))
  app.use(express.json())
  app.use('/api', healthRoutes)
  app.use('/api', eventRoutes)

  return app
}

module.exports = { createApp }
