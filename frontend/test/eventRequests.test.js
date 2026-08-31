import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const page = read('src/pages/CommunityRequestsPage.jsx')
const hook = read('src/hooks/useEventRequests.js')
const card = read('src/components/community/EventRequestCard.jsx')
const details = read('src/pages/EventRequestDetailsPage.jsx')
const requestBasicInfo = read('src/components/events/RequestStep01BasicInfo.jsx')
const requestLocation = read('src/components/events/RequestStep03Location.jsx')
const requestForm = read('src/pages/CreateEventRequestPage.jsx')

const count = (source, pattern) => (source.match(pattern) || []).length

test('loading, success, empty, and error states exist on the Community Requests page', () => {
  assert.match(page, /status === 'loading'/)
  assert.match(page, /status === 'success'/)
  assert.match(page, /requests\.length === 0/)
  assert.match(page, /status === 'error'/)
})

test('retry uses the existing reload operation', () => {
  assert.match(page, /onClick=\{reload\}/)
  assert.match(hook, /const reload = useCallback/)
  assert.match(hook, /useEffect\(\(\) => \{ reload\(\) \}, \[reload\]\)/)
})

test('authenticated users load existing interest state without a new endpoint', () => {
  assert.match(hook, /useAuth\(\)/)
  assert.match(hook, /getInterestStatus\(request\.requestId\)/)
  assert.match(hook, /Promise\.all\(/)
  assert.match(hook, /result\.interested\?\.interested/)
  assert.doesNotMatch(hook, /fetch\(/)
})

test('interest loading prevents duplicate clicks and shows Saving', () => {
  assert.match(hook, /if \(!authenticated \|\| interestLoadingId \|\| interestedIds\.has\(requestId\)\) return/)
  assert.match(card, /disabled=\{isInterested \|\| interestLoading\}/)
  assert.match(card, /interestLoading \? 'Saving…'/)
})

test('unauthenticated users are routed to Login to Express Interest', () => {
  assert.match(card, /authenticated \? \(/)
  assert.match(card, /Login to Express Interest/)
  assert.match(card, /to="\/login"/)
})

test('authenticated users receive Express Interest and Interested states', () => {
  assert.match(card, /isInterested \? 'Interested/)
assert.match(card, /interestLabel/)
  assert.match(card, /isInterested \? 'Interested ✓'/)
})

test('threshold reached requests do not render an Express Interest action', () => {
  assert.match(card, /request\.status === 'COLLECTING_DEMAND'/)
  assert.match(card, /Threshold Reached/)
  assert.equal(count(card, /Express Interest/g), 1)
})

test('Community Requests preserves backend-derived demand values and progress', () => {
  assert.match(card, /getDemandCount\(request\)/)
  assert.match(card, /getDemandThreshold\(request\)/)
  assert.match(card, /getDemandPercentage\(request\)/)
  assert.match(card, /getDemandProgress\(request\)/)
  assert.match(card, /request\.createdAt/)
})

test('details page loads interest state through the existing endpoint', () => {
  assert.match(details, /getInterestStatus\(requestId\)/)
  assert.match(details, /expressInterest\(requestId\)/)
  assert.match(details, /action === 'interest'/)
  assert.match(details, /request\.status === 'THRESHOLD_REACHED'/)
})

test('organizer actions remain protected by authenticated user identity', () => {
  assert.match(details, /currentUser\?\.userId === request\.organizerId/)
  assert.match(details, /request\.status === 'THRESHOLD_REACHED'/)
  assert.match(details, /confirmEventRequest\(requestId\)/)
  assert.match(details, /confirmEventRequestAnyway\(requestId\)/)
  assert.match(details, /declineEventRequest\(requestId\)/)
})

test('Event Request Step 1 reuses the existing AI description service and parent form state', () => {
  assert.match(requestBasicInfo, /generateEventDescription\(/)
  assert.match(requestBasicInfo, /description: currentForm\.description \|\| ''/)
  assert.match(requestBasicInfo, /category: currentForm\.category \|\| ''/)
  assert.match(requestBasicInfo, /city: currentForm\.city \|\| ''/)
  assert.match(requestBasicInfo, /neighborhood: currentForm\.neighborhood \|\| ''/)
  assert.match(requestBasicInfo, /location: currentForm\.location \|\| ''/)
  assert.match(requestBasicInfo, /update\('description'/)
  assert.match(requestBasicInfo, /DESCRIPTION_MAX_LENGTH = 500/)
  assert.match(requestBasicInfo, /event-description-textarea--generating/)
})

test('Event Request AI generation preserves debounce and stale-response protection', () => {
  assert.match(requestBasicInfo, /DESCRIPTION_DEBOUNCE_MS = 850/)
  assert.match(requestBasicInfo, /setTimeout\(async \(\) =>/)
  assert.match(requestBasicInfo, /requestIdRef\.current/)
  assert.match(requestBasicInfo, /latestTitleRef\.current !== title/)
  assert.match(requestBasicInfo, /requestIdRef\.current \+= 1/) 
})

test('Event Request location reuses searchLocations with debounce and stale-request protection', () => {
  assert.match(requestLocation, /searchLocations\(normalizedQuery\)/)
  assert.match(requestLocation, /LOCATION_DEBOUNCE_MS = 400/)
  assert.match(requestLocation, /requestIdRef\.current/)
  assert.match(requestLocation, /suggestion\?\.city/)
  assert.match(requestLocation, /suggestion\?\.neighborhood/)
  assert.match(requestLocation, /suggestion\?\.latitude/)
  assert.match(requestLocation, /suggestion\?\.longitude/)
})

test('Event Request keeps selected venue data in the existing submission payload', () => {
  assert.match(requestForm, /location: form\.location\.trim\(\)/)
  assert.match(requestForm, /city: form\.city\.trim\(\)/)
  assert.match(requestForm, /neighborhood: form\.neighborhood \? form\.neighborhood\.trim\(\) : ''/)
  assert.match(requestForm, /latitude: form\.latitude/)
  assert.match(requestForm, /longitude: form\.longitude/)
  assert.match(requestForm, /createEventRequest\(payload\)/)
})

test('Community Requests hero card contains a link to How It Works page', () => {
  assert.match(page, /See How it works\?/)
  assert.match(page, /to="\/how-it-works"/)
})

