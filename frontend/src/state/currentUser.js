const DEVELOPMENT_USER_ID = import.meta.env.VITE_DEVELOPMENT_USER_ID || 'dev_user'

export function getCurrentDevelopmentUserId() {
  return DEVELOPMENT_USER_ID
}
