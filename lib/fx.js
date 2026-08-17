// lib/fx.js
// Shared exchange rate logic. Both app/api/exchange-rate/route.js and
// app/api/calculate/route.js call this directly instead of one route
// making an HTTP fetch to the other. That self-fetch was the actual
// source of "fetch failed" in production, not a network/DNS issue on
// the external open.er-api.com side.
//
// IMPORTANT: exchange rates are now persisted to Supabase, not just the
// in-memory Map in lib/cache.js. The in-memory cache is scoped to a
// single warm serverless instance and Vercel gives no guarantee about
// how long an instance stays warm — it can easily outlive a "12 hour"
// TTL, which is what caused rates to go stale for days at a time.
// Supabase gives a shared, cross-instance source of truth so the rate
// actually refreshes on the schedule we intend.

import { get, set, TTL } from '@/lib/cache'
import { supabaseAdmin } from '@/lib/supabase'

export const ORIGIN_CURRENCY = {
  'USA':          { code: 'USD', symbol: '$',   name: 'US Dollar',      useUsd: true  },
  'Canada':       { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', useUsd: false },
  'Japan':        { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',    useUsd: false },
  'China':        { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',    useUsd: false },
  'Germany':      { code: 'EUR', symbol: '€',   name: 'Euro',            useUsd: false },
  'Belgium':      { code: 'EUR', symbol: '€',   name: 'Euro',            useUsd: false },
  'Netherlands':  { code: 'EUR', symbol: '€',   name: 'Euro',            useUsd: false },
  'UK':           { code: 'GBP', symbol: '£',   name: 'British Pound',   useUsd: false },
  'UAE':          { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',      useUsd: false },
  'South Korea':  { code: 'KRW', symbol: '₩',   name: 'Korean Won',      useUsd: false },
}

export function getRateForOrigin(origin) {
  return ORIGIN_CURRENCY[origin] || ORIGIN_CURRENCY['USA']
}

// How long a Supabase-cached rate is considered fresh before we attempt
// a live refetch. Keep this at or below the interval your cron job runs
// on (see notes at bottom of file) so the two stay in sync.
const SUPABASE_FRESHNESS_MS = 12 * 60 * 60 * 1000 // 12 hours
const FX_CACHE_ROW_KEY = 'usd_ghs_rates'

async function readSupabaseRateCache() {
  try {
    const { data, error } = await supabaseAdmin
      .from('fx_rate_cache')
      .select('rates, updated_at')
      .eq('cache_key', FX_CACHE_ROW_KEY)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const age = Date.now() - new Date(data.updated_at).getTime()
    if (age > SUPABASE_FRESHNESS_MS) return null // stale, force a refetch

    return data.rates
  } catch (err) {
    console.error('[FX SUPABASE READ ERROR]', err.message)
    return null
  }
}

async function writeSupabaseRateCache(rates) {
  try {
    const { error } = await supabaseAdmin
      .from('fx_rate_cache')
      .upsert({ cache_key: FX_CACHE_ROW_KEY, rates, updated_at: new Date().toISOString() })
    if (error) throw error
  } catch (err) {
    console.error('[FX SUPABASE WRITE ERROR]', err.message)
  }
}

export async function fetchAllRates() {
  const cacheKey = 'fx:all_rates'

  // 1. Fast path: in-memory cache. This is only ever a same-instance,
  //    same-request-burst optimization now — it is NOT relied on for
  //    day-to-day freshness, since it can silently outlive its TTL on a
  //    long-lived warm instance. Kept short deliberately (see TTL below).
  const memCached = get(cacheKey)
  if (memCached) return memCached

  // 2. Shared source of truth: Supabase. This is what actually gives us
  //    "the rate is at most ~12h old" across every instance/user.
  const supabaseCached = await readSupabaseRateCache()
  if (supabaseCached) {
    set(cacheKey, supabaseCached, TTL.EXCHANGE_RATE)
    return supabaseCached
  }

  console.log('[FX] Fetching fresh exchange rates')

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })

    if (!res.ok) throw new Error('open.er-api failed')
    const data = await res.json()
    if (!data.rates?.GHS) throw new Error('GHS not in response')

    const usdGhs = data.rates.GHS

    const rates = {
      USD: parseFloat(usdGhs.toFixed(4)),
      CAD: parseFloat((usdGhs / data.rates.CAD).toFixed(4)),
      JPY: parseFloat((usdGhs / data.rates.JPY).toFixed(6)),
      CNY: parseFloat((usdGhs / data.rates.CNY).toFixed(4)),
      EUR: parseFloat((usdGhs / data.rates.EUR).toFixed(4)),
      GBP: parseFloat((usdGhs / data.rates.GBP).toFixed(4)),
      AED: parseFloat((usdGhs / data.rates.AED).toFixed(4)),
      KRW: parseFloat((usdGhs / data.rates.KRW).toFixed(6)),
      USD_GHS: parseFloat(usdGhs.toFixed(4)),
      date: new Date().toISOString().split('T')[0],
      source: 'open.er-api.com',
    }

    set(cacheKey, rates, TTL.EXCHANGE_RATE)
    await writeSupabaseRateCache(rates)
    console.log(`[FX] Live rates cached: 1 USD = GH₵ ${rates.USD}, 1 JPY = GH₵ ${rates.JPY}, 1 CNY = GH₵ ${rates.CNY}`)
    return rates

  } catch (e1) {
    console.warn('[FX] Primary source failed:', e1.message, e1.cause?.code || e1.cause || '')

    // Before giving up, check Supabase one more time even if slightly
    // stale — a rate that's a day or two old is still far more accurate
    // than the hardcoded fallback below, which does not track reality
    // at all once the market moves.
    const staleButReal = await readStaleSupabaseRateCache()
    if (staleButReal) {
      console.warn('[FX] Using stale-but-real Supabase rate as fallback instead of hardcoded value')
      set(cacheKey, staleButReal, 15 * 60 * 1000)
      return staleButReal
    }

    const fallback = {
      USD:     11.63,
      CAD:     8.26,
      JPY:     0.0711,
      CNY:     1.718,
      EUR:     13.25,
      GBP:     15.52,
      AED:     3.16,
      KRW:     0.0084,
      USD_GHS: 11.63,
      date: new Date().toISOString().split('T')[0],
      source: 'Hardcoded Fallback (last resort — verify rate manually)',
    }

    set(cacheKey, fallback, 15 * 60 * 1000)
    return fallback
  }
}

// Used only inside the catch block above: reads whatever is in Supabase
// regardless of age, since "old but real" beats a hardcoded constant.
async function readStaleSupabaseRateCache() {
  try {
    const { data, error } = await supabaseAdmin
      .from('fx_rate_cache')
      .select('rates')
      .eq('cache_key', FX_CACHE_ROW_KEY)
      .maybeSingle()
    if (error) throw error
    return data?.rates || null
  } catch (err) {
    console.error('[FX SUPABASE STALE READ ERROR]', err.message)
    return null
  }
}

/*
 * SETUP NOTES:
 *
 * 1. Create the Supabase table this file depends on:
 *
 *    create table fx_rate_cache (
 *      cache_key text primary key,
 *      rates jsonb not null,
 *      updated_at timestamptz not null default now()
 *    );
 *
 * 2. This alone fixes the "stuck for days" bug, since every instance now
 *    reads/writes the same row instead of an isolated in-memory Map.
 *    But refreshing still only happens when a real user request causes
 *    a cache miss (i.e. more than 12h since the last write). On a
 *    low-traffic site that could still mean the rate sits stale for a
 *    while past 12h if nobody happens to hit the endpoint right then.
 *
 * 3. For a true "always refreshes once a day, no matter what" guarantee,
 *    add a Vercel Cron Job (vercel.json) that hits a small route once a
 *    day, e.g.:
 *
 *      { "crons": [{ "path": "/api/cron/refresh-fx", "schedule": "0 6 * * *" }] }
 *
 *    where /api/cron/refresh-fx just calls fetchAllRates() (or a version
 *    that skips the cache check and always fetches). This decouples the
 *    refresh from user traffic entirely.
 */