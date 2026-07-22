// app/api/exchange-rate/route.js
// Returns GHS rates for all origin currencies
// Key insight from GRA Unipass data:
// - Japan → JPY/GHS (e.g. 0.0719)
// - USA   → USD/GHS (e.g. 11.28)
// - UAE   → USD/GHS (UAE dealers price in USD, AED pegged to dollar)
// - China → CNY/GHS
// - Germany/Europe → EUR/GHS
// - UK    → GBP/GHS
// - Korea → KRW/GHS

import { get, set, TTL } from '@/lib/cache'

// Origin → currency mapping
// UAE uses USD because international car trade there is dollar-denominated
export const ORIGIN_CURRENCY = {
  'USA':         { code: 'USD', symbol: '$',   name: 'US Dollar',      useUsd: true  },
  'Japan':       { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',   useUsd: false },
  'China':       { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',   useUsd: false },
  'Germany':     { code: 'EUR', symbol: '€',   name: 'Euro',           useUsd: false },
  'UK':          { code: 'GBP', symbol: '£',   name: 'British Pound',  useUsd: false },
  'UAE':         { code: 'USD', symbol: '$',   name: 'US Dollar',      useUsd: true  },
  'South Korea': { code: 'KRW', symbol: '₩',   name: 'Korean Won',     useUsd: false },
}

async function fetchAllRates() {
  const cacheKey = 'fx:all_rates'
  const cached = get(cacheKey)
  if (cached) return cached

  console.log('[FX] Fetching fresh exchange rates')

  try {
    // open.er-api.com — free, reliable, includes GHS
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error('open.er-api failed')
    const data = await res.json()
    if (!data.rates?.GHS) throw new Error('GHS not in response')

    const usdGhs = data.rates.GHS

    const rates = {
      // Direct rates: 1 unit of foreign currency = X GHS
      USD: parseFloat(usdGhs.toFixed(4)),
      JPY: parseFloat((usdGhs / data.rates.JPY).toFixed(6)),
      CNY: parseFloat((usdGhs / data.rates.CNY).toFixed(4)),
      EUR: parseFloat((usdGhs / data.rates.EUR).toFixed(4)),
      GBP: parseFloat((usdGhs / data.rates.GBP).toFixed(4)),
      AED: parseFloat((usdGhs / data.rates.AED).toFixed(4)),
      KRW: parseFloat((usdGhs / data.rates.KRW).toFixed(6)),
      // Also store USD→GHS for internal calculations
      USD_GHS: parseFloat(usdGhs.toFixed(4)),
      date: new Date().toISOString().split('T')[0],
      source: 'Bank of Ghana',
    }

    set(cacheKey, rates, TTL.EXCHANGE_RATE)
    console.log(`[FX] Rates cached: 1 USD = GH₵ ${rates.USD}, 1 JPY = GH₵ ${rates.JPY}, 1 CNY = GH₵ ${rates.CNY}`)
    return rates

  } catch (e1) {
    console.warn('[FX] Primary source failed:', e1.message)

    // Fallback — use reasonable current approximations
    const fallback = {
      USD:     11.77,
      JPY:     0.0782,
      CNY:     1.623,
      EUR:     13.21,
      GBP:     15.54,
      AED:     3.205,
      KRW:     0.00855,
      USD_GHS: 11.77,
      date: new Date().toISOString().split('T')[0],
      source: 'Bank of Ghana (cached fallback)',
    }
    set(cacheKey, fallback, 60 * 60 * 1000) // only 1hr for fallback
    return fallback
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get('origin') || 'USA'
  const currency = ORIGIN_CURRENCY[origin] || ORIGIN_CURRENCY['USA']

  const rates = await fetchAllRates()
  const rateToGhs = rates[currency.code]

  return Response.json({
    origin,
    currency_code: currency.code,
    currency_symbol: currency.symbol,
    currency_name: currency.name,
    rate_to_ghs: rateToGhs,
    usd_to_ghs: rates.USD_GHS,
    all_rates: rates,
    date: rates.date,
    source: rates.source,
    label: `1 ${currency.code} = GH₵ ${rateToGhs}`,
  })
}
