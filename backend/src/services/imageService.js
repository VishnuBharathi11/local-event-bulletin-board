const { getFirebaseApp } = require('../config/firebaseAdmin')
const admin = require('firebase-admin')
const crypto = require('crypto')

/**
 * Uploads a base64 encoded image to Google Cloud Storage.
 * @param {string} base64Data The base64 data string (including data:image/xxx;base64, prefix)
 * @returns {Promise<string>} The URL of the uploaded image.
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
    console.error('CRITICAL: GCS_BUCKET_NAME is not defined in environment variables.')
    throw new Error('Image upload failed: Storage not configured in backend environment.')
  }

  const bucket = admin.storage(getFirebaseApp()).bucket(bucketName)

  // Generate a unique filename
  const filename = `events/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`
  const file = bucket.file(filename)

  console.log(`Uploading to bucket: ${bucketName}, file: ${filename}`)

  await file.save(buffer, {
    metadata: {
      contentType: `image/${extension}`,
    },
    resumable: false,
  })

  // If Public Access Prevention is enabled, makePublic() will fail.
  // We will try to make it public just in case, but rely on signed URLs for guaranteed access.
  try {
    await file.makePublic()
    console.log(`Image ${filename} made public.`)
    return `https://storage.googleapis.com/${bucketName}/${filename}`
  } catch (error) {
    console.warn('Could not make image public (expected if PAP is enabled). Generating signed URL instead.', error.message)

    // Generate a long-lived signed URL (e.g., 7 days) for the database.
    // For a production app with high security, we'd sign on-the-fly during GET,
    // but for stability/simplicity before a presentation, this works well.
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return signedUrl
  }
}

module.exports = {
  uploadImage,
}
