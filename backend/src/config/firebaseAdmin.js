const admin = require('firebase-admin')

let firebaseApp

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp

  if (admin.apps.length > 0) {
    firebaseApp = admin.app()
    return firebaseApp
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
  } else {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
  }

  return firebaseApp
}

function getFirestore() {
  return getFirebaseApp().firestore()
}

module.exports = { getFirebaseApp, getFirestore }
