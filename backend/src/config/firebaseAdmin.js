const admin = require('firebase-admin')

let firebaseApp

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp

  try {
    firebaseApp = admin.app()
    return firebaseApp
  } catch (_) {
    // Firebase app is not initialized yet.
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'genial-core-506613-t3'
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (clientEmail && privateKey) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      projectId,
    })
  } else {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    })
  }

  return firebaseApp
}

function getFirebaseAuth() {
  return admin.auth(getFirebaseApp())
}

function getFirestore() {
  const app = getFirebaseApp()
  return admin.firestore(app)
}

module.exports = {
  getFirebaseApp,
  getFirebaseAuth,
  getFirestore,
}
