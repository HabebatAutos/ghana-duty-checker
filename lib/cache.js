// lib/cache.js
// Persistent file-based cache — survives server restarts
// Falls back to in-memory if file system unavailable
// TTL: 7 days for MSRP (vehicle prices rarely change), 12 hours for exchange rate

import fs from 'fs'
import path from 'path'

const CACHE_FILE = path.join(process.cwd(), '.cache', 'msrp-cache.json')
const store = new Map()
let fileStoreLoaded = false

// ── FILE PERSISTENCE ─────────────────────────────────────────────────────────
function ensureCacheDir() {
  const dir = path.dirname(CACHE_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function loadFromFile() {
  if (fileStoreLoaded) return
  fileStoreLoaded = true
  try {
    ensureCacheDir()
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8')
      const entries = JSON.parse(raw)
      let loaded = 0
      for (const [key, entry] of Object.entries(entries)) {
        if (Date.now() < entry.expiresAt) {
          store.set(key, entry)
          loaded++
        }
      }
      console.log(`[CACHE] Loaded ${loaded} entries from disk`)
    }
  } catch (e) {
    console.warn('[CACHE] Could not load cache file:', e.message)
  }
}

function saveToFile() {
  try {
    ensureCacheDir()
    const obj = {}
    for (const [key, entry] of store.entries()) {
      if (Date.now() < entry.expiresAt) obj[key] = entry
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2))
  } catch (e) {
    console.warn('[CACHE] Could not save cache file:', e.message)
  }
}

// ── CORE OPERATIONS ──────────────────────────────────────────────────────────
function set(key, value, ttlMs) {
  loadFromFile()
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  // Only persist MSRP entries (exchange rates refresh frequently)
  if (key.startsWith('msrp:')) saveToFile()
}

function get(key) {
  loadFromFile()
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
  saveToFile()
}

function stats() {
  loadFromFile()
  return { size: store.size, keys: [...store.keys()] }
}

const TTL = {
  MSRP:          7 * 24 * 60 * 60 * 1000,  // 7 days — vehicle prices stable
  EXCHANGE_RATE: 12 * 60 * 60 * 1000,       // 12 hours — rates change daily
}

function msrpKey(year, make, model, trim, currencyCode) {
  return `msrp:${year}:${make}:${model}:${trim || 'base'}:${currencyCode || 'USD'}`
    .toLowerCase()
    .replace(/\s+/g, '_')
}

const exchangeRateKey = 'exchange_rate:usd_ghs'

export { set, get, del, stats, TTL, msrpKey, exchangeRateKey }
