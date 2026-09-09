const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'gemini-embedding-001'
const EMBEDDING_TASK_TYPE = process.env.EMBEDDING_TASK_TYPE || 'RETRIEVAL_DOCUMENT'
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 768)
const EMBEDDING_CONFIG_VERSION = process.env.EMBEDDING_CONFIG_VERSION || 'phase5.1-v1'

const MAX_FIRESTORE_VECTOR_DIMENSIONS = 2048

function validateEmbeddingConfig(config = {}) {
  const model = config.model ?? EMBEDDING_MODEL
  const taskType = config.taskType ?? EMBEDDING_TASK_TYPE
  const dimensions = config.dimensions ?? EMBEDDING_DIMENSIONS
  const version = config.configVersion ?? EMBEDDING_CONFIG_VERSION

  if (typeof model !== 'string' || !model.trim()) throw new TypeError('embedding model must be a non-empty string')
  if (typeof taskType !== 'string' || !taskType.trim()) throw new TypeError('embedding task type must be a non-empty string')
  if (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > MAX_FIRESTORE_VECTOR_DIMENSIONS) {
    throw new TypeError(`embedding dimensions must be an integer between 1 and ${MAX_FIRESTORE_VECTOR_DIMENSIONS}`)
  }
  if (typeof version !== 'string' || !version.trim()) throw new TypeError('embedding config version must be a non-empty string')

  return Object.freeze({ model: model.trim(), taskType: taskType.trim(), dimensions, configVersion: version.trim() })
}

const EMBEDDING_CONFIG = validateEmbeddingConfig()

module.exports = {
  EMBEDDING_MODEL,
  EMBEDDING_TASK_TYPE,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_CONFIG_VERSION,
  MAX_FIRESTORE_VECTOR_DIMENSIONS,
  validateEmbeddingConfig,
  EMBEDDING_CONFIG,
}
