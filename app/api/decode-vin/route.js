// app/api/decode-vin/route.js

// Real VINs are exactly 17 characters, alphanumeric, and never contain the
// letters I, O, or Q (excluded industry-wide to avoid visual confusion with
// 1 and 0). A plain length check alone lets junk like "NO.:LNNBBDDWORG00"
// through whenever it coincidentally lands on 17 characters — this happened
// in production and got NHTSA to reject the lookup, which was then
// mislabeled as "NHTSA API unavailable" even though NHTSA was fine and the
// input was simply invalid.
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/

// VINs also carry a checksum in position 9 (index 8), computed from the
// other 16 characters via a weighted transliteration. This catches garbage
// that happens to be 17 valid-looking characters but still isn't a real
// VIN (e.g. a scrambled/mis-OCR'd string), which the format regex alone
// can't detect. We never want to spend an NHTSA call — or, on paid VIN
// lookups, an AI call downstream — on something that fails this check.
const VIN_TRANSLITERATION = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
}
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

function isValidVinChecksum(vin) {
  // Not all markets/model years enforce this checksum as strictly as US-issued
  // VINs (it's a North American requirement, not universal), so treat a
  // failed checksum as a soft signal rather than an outright rejection —
  // format + charset (VIN_PATTERN) remains the hard gate. Callers can choose
  // to warn-log a checksum mismatch without blocking the lookup entirely.
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const ch = vin[i]
    const value = /[0-9]/.test(ch) ? Number(ch) : (VIN_TRANSLITERATION[ch] ?? null)
    if (value === null) return false
    sum += value * VIN_WEIGHTS[i]
  }
  const remainder = sum % 11
  const expected = remainder === 10 ? 'X' : String(remainder)
  return vin[8] === expected
}

function buildTrim(r) {
  // NHTSA stores trim info across multiple fields depending on manufacturer
  // Priority order: Trim > Series > DriveType+BodyClass combination
  const parts = []

  if (r.Trim && r.Trim.trim()) return r.Trim.trim()
  if (r.Series && r.Series.trim()) return r.Series.trim()

  // Build a descriptive trim from available data
  if (r.DriveType && r.DriveType.trim()) parts.push(r.DriveType.trim())
  if (r.DisplacementL) parts.push(parseFloat(r.DisplacementL).toFixed(1) + 'L')

  return parts.join(' ') || ''
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const rawVin = searchParams.get('vin')
  const vin = rawVin?.trim().toUpperCase()

  if (!vin || !VIN_PATTERN.test(vin)) {
    console.warn(`[VIN DECODE] Rejected malformed VIN input: "${rawVin}"`)
    return Response.json(
      { error: 'A valid 17-character VIN is required. Please check for typos or stray characters.' },
      { status: 400 }
    )
  }

  // Soft check only — checksum is a North American convention, not
  // universal across every market NHTSA covers, so we log and proceed
  // rather than block. This still means zero NHTSA calls are ever made
  // for the hard case (wrong length/charset), which was the actual bug.
  if (!isValidVinChecksum(vin)) {
    console.warn(`[VIN DECODE] Checksum mismatch for "${vin}" — proceeding anyway (non-US VINs may not follow this convention)`)
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!res.ok) {
      // Capture the actual status/body so future occurrences of this error
      // are diagnosable — previously this info was discarded, making every
      // failure (real outage, rate limit, bad request) look identical in
      // the logs as a generic "NHTSA API unavailable".
      let bodyText = ''
      try {
        bodyText = await res.text()
      } catch (_) {
        // ignore — body may not be readable, status code alone is still useful
      }
      throw new Error(
        `NHTSA responded with HTTP ${res.status} ${res.statusText}${bodyText ? ` — body: ${bodyText.slice(0, 300)}` : ''}`
      )
    }

    const data = await res.json()
    const r = data.Results?.[0]

    if (!r || !r.Make) {
      return Response.json({ error: 'VIN not found in NHTSA database. Please use manual entry.' }, { status: 404 })
    }

    const engineParts = [
      r.DisplacementL ? parseFloat(r.DisplacementL).toFixed(1) + 'L' : '',
      r.EngineCylinders ? r.EngineCylinders + '-cyl' : '',
      r.FuelTypePrimary || '',
    ].filter(Boolean)

    const trim = buildTrim(r)

    // Log what NHTSA returned for debugging
    console.log(`[VIN ${vin}] Trim="${r.Trim}" Series="${r.Series}" DriveType="${r.DriveType}" → resolved trim="${trim}"`)

    return Response.json({
      success: true,
      vehicle: {
        vin,
        year: r.ModelYear || '',
        make: r.Make || '',
        model: r.Model || '',
        trim,
        engine: engineParts.join(' '),
        bodyType: r.BodyClass || '',
        driveType: r.DriveType || '',
        plantCountry: r.PlantCountry || '',
        fuelType: r.FuelTypePrimary || '',
      }
    })

  } catch (err) {
    // Distinguish a genuine timeout (NHTSA too slow / hung) from a real
    // HTTP-level rejection, from a hard network failure. All three used to
    // collapse into the same opaque "NHTSA API unavailable" message.
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError'
    const category = isTimeout ? 'TIMEOUT' : (err.message?.startsWith('NHTSA responded') ? 'HTTP_ERROR' : 'NETWORK_ERROR')

    console.error(`[VIN DECODE][${category}] vin="${vin}":`, err.message)

    return Response.json(
      { error: 'VIN lookup failed. Please use manual entry.' },
      { status: 500 }
    )
  }
}