const { getFirebaseApp } = require('../config/firebaseAdmin')
const admin = require('firebase-admin')
const crypto = require('crypto')

/**
 * Uploads a base64 encoded image to Google Cloud Storage.
 * @param {string} base64Data The base64 data string (including data:image/xxx;base64, prefix)
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
async function uploadImage(base64Data) {
  if (!base64Data || typeof base64Data !== 'string') {
    return null
  }

  // Basic validation of data URL format
  const matches = base64Data.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/)
  if (!matches) {
    throw new Error('Invalid image format. Expected a base64 data URL.')
  }

  const extension = matches[1]
  const buffer = Buffer.from(matches[2], 'base64')

  // File size validation (5MB limit as specified in the form)
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image size exceeds the 5MB limit.')
  }

  const bucketName = process.env.GCS_BUCKET_NAME
  if (!bucketName) {
    console.error('GCS_BUCKET_NAME is not defined in environment variables.')
    throw new Error('Image upload failed: Storage not configured.')
  }

  const bucket = admin.storage(getFirebaseApp()).bucket(bucketName)

  // Generate a unique filename
  const filename = `events/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`
  const file = bucket.file(filename)

  await file.save(buffer, {
    metadata: {
      contentType: `image/${extension}`,
    },
    resumable: false,
  })

  // In many production environments, we would make the file public.
  // For stability and presentation, we'll return the standard GCS public URL format.
  // Note: This assumes the bucket or object has public read permissions.
  // If not, a signed URL would be required, but public URL is simpler for a hackathon.
  try {
    await file.makePublic()
  } catch (error) {
    console.warn('Failed to make image public. It might already be public or permissions are restricted.', error.message)
  }

  return `https://storage.googleapis.com/${bucketName}/${filename}`
}

module.exports = {
  uploadImage,
}
