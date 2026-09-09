require('dotenv').config()

const { createApp } = require('./app')

const app = createApp()
const PORT = process.env.PORT || 8080

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`)
})

server.on('error', (error) => {
  console.error('CRITICAL: Server failed to start:', error)
  process.exit(1)
})
