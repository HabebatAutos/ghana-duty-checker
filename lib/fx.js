// lib/fx.js
// Shared exchange rate logic. Both app/api/exchange-rate/route.js and
// app/api/calculate/route.js call this directly instead of one route
// making an HTTP fetch to the other. That self-fetch was the actual
// source of "fetch failed" in production, not a network/DNS issue on
// the external open.er-api.com side.

import { get, set, TTL } from '@/lib/cache'

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

export async function fetchAllRates() {
  const cacheKey = 'fx:all_rates'
  const cached = get(cacheKey)
  if (cached) return cached

  console.log('[FX] Fetching fresh exchange rates')

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 43200 },
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
      source: 'Bank of Ghana',
    }

    set(cacheKey, rates, TTL.EXCHANGE_RATE)
    console.log(`[FX] Live rates cached: 1 USD = GH₵ ${rates.USD}, 1 JPY = GH₵ ${rates.JPY}, 1 CNY = GH₵ ${rates.CNY}`)
    return rates

  } catch (e1) {
    console.warn('[FX] Primary source failed:', e1.message, e1.cause?.code || e1.cause || '')

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
      source: 'Bank of Ghana (Fallback)',
    }

    set(cacheKey, fallback, 15 * 60 * 1000)
    return fallback
  }
}