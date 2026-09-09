const test = require('node:test')
const assert = require('node:assert/strict')

const firebaseAdmin = require('../src/config/firebaseAdmin')

class FakeDocRef {
  constructor(collection, id) {
    this.collection = collection
    this.id = id
  }
}

class FakeTransaction {
  constructor(firestore) {
    this.firestore = firestore
    this.operations = []
  }

  async get(ref) {
    const data = this.firestore.read(ref)
    return { exists: data !== undefined, get: (field) => data?.[field], data: () => data, id: ref.id }
  }

  set(ref, data) { this.operations.push({ type: 'set', ref, data }) }
  update(ref, field, value) { this.operations.push({ type: 'update', ref, field, value }) }
  delete(ref) { this.operations.push({ type: 'delete', ref }) }
}

class FakeFirestore {
  constructor() {
    this.collections = new Map()
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new Map())
    const documents = this.collections.get(name)
    return { doc: (id) => new FakeDocRef(name, id), _documents: documents }
  }

  read(ref) {
    return this.collections.get(ref.collection)?.get(ref.id)
  }

  async runTransaction(callback) {
    const transaction = new FakeTransaction(this)
    await callback(transaction)
    for (const operation of transaction.operations) {
      const documents = this.collections.get(operation.ref.collection)
      if (operation.type === 'set') documents.set(operation.ref.id, { ...operation.data })
      if (operation.type === 'update') {
        const document = documents.get(operation.ref.id) || {}
        document[operation.field] = operation.value
        documents.set(operation.ref.id, document)
      }
      if (operation.type === 'delete') documents.delete(operation.ref.id)
    }
  }
}

const firestore = new FakeFirestore()
firebaseAdmin.getFirestore = () => firestore
const { getRSVPId, hasUserRSVPd, rsvpToEvent, removeRSVP } = require('../src/repositories/rsvpRepository')

function seedEvent(eventId, rsvpCount = 0) {
  firestore.collection('events')._documents.set(eventId, { rsvpCount })
}

test('RSVP identity uses the existing eventId_userId key', async () => {
  assert.equal(getRSVPId('event-1', 'user-1'), 'event-1_user-1')
})

test('RSVP creation is duplicate-safe and increments rsvpCount once', async () => {
  seedEvent('event-1')

  await rsvpToEvent('event-1', 'user-1')
  await rsvpToEvent('event-1', 'user-1')

  assert.equal(await hasUserRSVPd('event-1', 'user-1'), true)
  assert.equal(firestore.read(new FakeDocRef('events', 'event-1')).rsvpCount, 1)
})

test('RSVP removal decrements once and does not make rsvpCount negative', async () => {
  seedEvent('event-2')
  await rsvpToEvent('event-2', 'user-2')

  await removeRSVP('event-2', 'user-2')
  await removeRSVP('event-2', 'user-2')

  assert.equal(await hasUserRSVPd('event-2', 'user-2'), false)
  assert.equal(firestore.read(new FakeDocRef('events', 'event-2')).rsvpCount, 0)
})
