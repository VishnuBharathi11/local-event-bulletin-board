function validateEmbeddingVector(vector, expectedDimensions) {
  if (!Array.isArray(vector) || vector.length === 0) {
    const error = new Error('embedding vector is empty or missing')
    error.code = 'EMBEDDING_EMPTY'
    throw error
  }

  if (!Number.isInteger(expectedDimensions) || expectedDimensions < 1) {
    throw new TypeError('expected embedding dimensions must be a positive integer')
  }

  if (vector.length !== expectedDimensions) {
    const error = new Error(`embedding vector length ${vector.length} does not match configured dimensionality ${expectedDimensions}`)
    error.code = 'EMBEDDING_DIMENSION_MISMATCH'
    throw error
  }

  for (const value of vector) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      const error = new Error('embedding vector contains a non-numeric or non-finite value')
      error.code = 'EMBEDDING_INVALID_VALUE'
      throw error
    }
  }

  return vector
}

module.exports = { validateEmbeddingVector }
