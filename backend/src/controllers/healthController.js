function getHealth(_req, res) {
  res.json({
    status: 'ok',
    service: 'local-event-bulletin-board-backend',
  })
}

module.exports = { getHealth }
