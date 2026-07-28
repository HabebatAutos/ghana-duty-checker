// app/api/exchange-rate/route.js
// Returns GHS rates for all origin currencies
// Key insight from GRA Unipass data:
// - Japan → JPY/GHS
// - USA   → USD/GHS
// - UAE   → AED/GHS (UAE dealers price in AED, pegged to dollar)
// - China → CNY/GHS
// - Germany/Europe → EUR/GHS
// - UK    → GBP/GHS
// - Korea → KRW/GHS
//
// The actual rate fetching logic now lives in lib/fx.js and is shared
// with app/api/calculate/route.js, which imports it directly instead
// of making an HTTP request to this route. That self-fetch was the
// real cause of the FALLBACK APPLIED errors in production.

import { ORIGIN_CURRENCY, fetchAllRates } from '@/lib/fx'

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