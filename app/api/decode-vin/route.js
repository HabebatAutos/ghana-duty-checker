// app/api/decode-vin/route.js

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
  const vin = searchParams.get('vin')?.toUpperCase()

  if (!vin || vin.length !== 17) {
    return Response.json({ error: 'A valid 17-character VIN is required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { next: { revalidate: 86400 } }
    )

    if (!res.ok) throw new Error('NHTSA API unavailable')

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
    console.error('VIN decode error:', err)
    return Response.json({ error: 'VIN lookup failed. Please use manual entry.' }, { status: 500 })
  }
}
