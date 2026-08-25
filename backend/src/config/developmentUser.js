const DEVELOPMENT_USER_ID = process.env.DEVELOPMENT_USER_ID || 'dev_user'

function getDevelopmentUserId() {
  return DEVELOPMENT_USER_ID
}

module.exports = { getDevelopmentUserId }
