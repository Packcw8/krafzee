import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listingProgress } from './listingProgress.js'

const ready = { photos: ['photo'], title: 'Vase', category: 'Ceramics', description: 'Handmade vase', price: '12', quantity: '1', requiresShipping: true, weight: '4', reviewed: true }
test('complete listing is ready to publish', () => assert.deepEqual(listingProgress(ready), [true, true, true, true, true]))
test('navigation alone cannot complete missing fields', () => assert.deepEqual(listingProgress({ ...ready, photos: [], title: '', price: '', weight: '', reviewed: false }), [false, false, false, false, false]))
test('pickup does not require shipping weight', () => assert.equal(listingProgress({ ...ready, requiresShipping: false, weight: '' })[3], true))
test('invalid prices, quantities and shipping weights remain incomplete', () => {
  for (const price of ['', ' ', '-1', 'NaN', 'Infinity']) assert.equal(listingProgress({ ...ready, price })[2], false)
  for (const quantity of ['', '0', '-1', '1.5', 'Infinity']) assert.equal(listingProgress({ ...ready, quantity })[2], false)
  for (const weight of ['', '0', '-1', 'Infinity']) assert.equal(listingProgress({ ...ready, weight })[3], false)
})
test('removing required details clears their check', () => assert.equal(listingProgress({ ...ready, description: ' ' })[1], false))
