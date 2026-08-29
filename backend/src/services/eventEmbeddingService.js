const { GoogleGenAI } = require('@google/genai')
const { EMBEDDING_CONFIG, validateEmbeddingConfig } = require('./eventEmbeddingConfig')
const { validateEmbeddingVector } = require('./embeddingValidator')

const DEFAULT_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'global'
let client

function isConfigured() {
  return Boolean(process.env.GOOGLE_CLOUD_PROJECT)
}

function getClient() {
  if (!isConfigured()) {
    const error = new Error('Vertex AI embedding service is not configured. Set GOOGLE_CLOUD_PROJECT and configure Google Cloud Application Default Credentials.')
    error.code = 'EMBEDDING_NOT_CONFIGURED'
    throw error
  }

  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: DEFAULT_LOCATION,
    })
  }

  return client
}

async function generateEventEmbedding(canonicalText, config = EMBEDDING_CONFIG, ai) {
  if (typeof canonicalText !== 'string' || !canonicalText.trim()) {
    throw new TypeError('canonical event text is required')
  }

  const embeddingConfig = validateEmbeddingConfig(config)
  const vertexClient = ai || getClient()

  const response = await vertexClient.models.embedContent({
    model: embeddingConfig.model,
    contents: canonicalText,
    config: {
      taskType: embeddingConfig.taskType,
      outputDimensionality: embeddingConfig.dimensions,
    },
  })

  const vector = response?.embeddings?.[0]?.values
  validateEmbeddingVector(vector, embeddingConfig.dimensions)

  return {
    vector,
    embeddingModel: embeddingConfig.model,
    embeddingDimensions: embeddingConfig.dimensions,
    embeddingTaskType: embeddingConfig.taskType,
    embeddingConfigVersion: embeddingConfig.configVersion,
  }
}

function resetClientForTests() {
  client = undefined
}

module.exports = {
  DEFAULT_LOCATION,
  isConfigured,
  getClient,
  generateEventEmbedding,
  resetClientForTests,
}
