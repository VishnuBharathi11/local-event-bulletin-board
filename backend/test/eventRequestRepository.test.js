const test = require('node:test')
const assert = require('node:assert/strict')

const firebaseAdmin = require('../src/config/firebaseAdmin')

class FakeDocRef {
  constructor(collection, id) {
    this.collection = collection
    this.id = id
  }
}

class FakeCollection {
  constructor(name, documents) {
    this.name = name
    this.documents = documents
    this.whereArgs = null
    this.orderByArgs = null
  }

  where(...args) {
    this.whereArgs = args
    return this
  }

  orderBy(...args) {
    this.orderByArgs = args
    return this
  }

  async get() {
    const docs = [...this.documents.entries()]
      .filter(([, data]) => ['COLLECTING_DEMAND', 'THRESHOLD_REACHED'].includes(data.status))
      .sort(([, a], [, b]) => b.createdAt - a.createdAt)
      .map(([id, data]) => ({ id, exists: true, data: () => data }))
    return { docs }
  }

  doc(id) {
    return new FakeDocRef(this.name, id)
  }
}

class FakeFirestore {
  constructor() {
    this.collections = new Map()
    this.transactions = []
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new Map())
    return new FakeCollection(name, this.collections.get(name))
  }

  read(ref) {
    return this.collections.get(ref.collection)?.get(ref.id)
  }

  async runTransaction(callback) {
    const operations = []
    const transaction = {
      get: async (ref) => {
        const data = this.read(ref)
        return { exists: data !== undefined, data: () => data, id: ref.id }
      },
      set: (ref, data) => operations.push({ type: 'set', ref, data }),
      update: (ref, data) => operations.push({ type: 'update', ref, data }),
    }

    await callback(transaction)
    for (const operation of operations) {
      const documents = this.collections.get(operation.ref.collection)
      if (operation.type === 'set') documents.set(operation.ref.id, { ...operation.data })
      if (operation.type === 'update') documents.set(operation.ref.id, { ...documents.get(operation.ref.id), ...operation.data })
    }
    this.transactions.push(operations)
  }
}

const firestore = new FakeFirestore()
firebaseAdmin.getFirestore = () => firestore
const repository = require('../src/repositories/eventRequestRepository')
const eventRequestService = require('../src/services/eventRequestService')

function seedRequest(requestId, overrides = {}) {
  firestore.collection('eventRequests').documents.set(requestId, {
    title: 'Community Workshop',
    description: 'A local request',
    category: 'Workshops',
    city: 'Coimbatore',
    neighborhood: 'RS Puram',
    location: 'Community Hall',
    startTime: 3000,
    endTime: 4000,
    demandCount: 0,
    demandThreshold: 2,
    status: 'COLLECTING_DEMAND',
    createdAt: 100,
    organizerId: 'organizer-1',
    ...overrides,
  })
}

test('active event request query filters the intended statuses and orders by createdAt descending', async () => {
  const collection = firestore.collection('eventRequests')
  collection.whereArgs = null
  collection.orderByArgs = null

  seedRequest('old', { createdAt: 100, status: 'COLLECTING_DEMAND' })
  seedRequest('threshold', { createdAt: 300, status: 'THRESHOLD_REACHED' })
  seedRequest('confirmed', { createdAt: 500, status: 'CONFIRMED' })
  seedRequest('declined', { createdAt: 400, status: 'DECLINED' })

  const requests = await repository.getEventRequests()
  assert.deepEqual(requests.map((request) => request.requestId), ['threshold', 'old'])

  const query = repository.buildActiveEventRequestQuery(collection)
  assert.deepEqual(query.whereArgs, ['status', 'in', ['COLLECTING_DEMAND', 'THRESHOLD_REACHED']])
  assert.deepEqual(query.orderByArgs, ['createdAt', 'desc'])
})

test('first interest increments demandCount', async () => {
  seedRequest('first-interest', { demandCount: 0, demandThreshold: 5 })

  const updated = await repository.expressInterest('first-interest', 'user-1')
  assert.equal(updated.demandCount, 1)
  assert.equal(updated.status, 'COLLECTING_DEMAND')
  assert.ok(firestore.read(new FakeDocRef('eventRequestInterest', 'first-interest_user-1')))
})

test('duplicate interest does not increment demandCount', async () => {
  seedRequest('duplicate-interest', { demandCount: 0, demandThreshold: 5 })

  await repository.expressInterest('duplicate-interest', 'user-1')
  const updated = await repository.expressInterest('duplicate-interest', 'user-1')

  assert.equal(updated.demandCount, 1)
})

test('interest reaching the request threshold changes status to THRESHOLD_REACHED', async () => {
  seedRequest('threshold-interest', { demandCount: 1, demandThreshold: 2 })

  const updated = await repository.expressInterest('threshold-interest', 'user-1')
  assert.equal(updated.demandCount, 2)
  assert.equal(updated.status, 'THRESHOLD_REACHED')
})

test('missing event request returns the existing not-found error', async () => {
  await assert.rejects(
    repository.expressInterest('missing-request', 'user-1'),
    (error) => error.message === 'Event request not found',
  )
})

test('unauthorized organizer action returns 403', async () => {
  const originalGet = repository.getEventRequestById
  repository.getEventRequestById = async () => ({ requestId: 'request-1', organizerId: 'organizer-1', status: 'THRESHOLD_REACHED' })

  try {
    await assert.rejects(
      eventRequestService.confirmEventRequest('request-1', 'different-user'),
      (error) => error.statusCode === 403 && error.message === 'You are not authorized to perform this action.',
    )
  } finally {
    repository.getEventRequestById = originalGet
  }
})
