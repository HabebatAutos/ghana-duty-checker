// lib/cache.js
// In-memory cache, scoped to a single warm serverless instance.
// Cross-instance/cold-start persistence for MSRP data now lives in
// Supabase (see lib/supabase.js). Exchange rates don't need disk
// persistence since they're cheap to refetch and have a short TTL.

const store = new Map()

function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

function get(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

function del(key) {
  store.delete(key)
}

function stats() {
  return { size: store.size, keys: [...store.keys()] }
}

const TTL = {
  MSRP:          7 * 24 * 60 * 60 * 1000,
  EXCHANGE_RATE: 12 * 60 * 60 * 1000,
}

function msrpKey(year, make, model, trim, currencyCode) {
  return `msrp:${year}:${make}:${model}:${trim || 'base'}:${currencyCode || 'USD'}`
    .toLowerCase()
    .replace(/\s+/g, '_')
}

const exchangeRateKey = 'exchange_rate:usd_ghs'

export { set, get, del, stats, TTL, msrpKey, exchangeRateKey }