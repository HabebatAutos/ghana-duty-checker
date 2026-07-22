'use client'

import { useState, useMemo } from 'react'
import { PRESET_DATA } from './presets-data'

// Maps raw origin codes or country names to standard UI origin labels
function normalizeOrigin(origin) {
  if (!origin) return 'USA';
  const o = origin.toString().trim().toUpperCase();
  if (o === 'CA' || o === 'CANADA') return 'Canada';
  if (o === 'KR' || o === 'KOREA' || o === 'SOUTH KOREA') return 'South Korea';
  if (o === 'AE' || o === 'UAE' || o === 'UNITED ARAB EMIRATES') return 'UAE';
  if (o === 'DE' || o === 'GERMANY') return 'Germany';
  if (o === 'BE' || o === 'BELGIUM') return 'Belgium';
  if (o === 'GB' || o === 'UK' || o === 'UNITED KINGDOM') return 'UK';
  if (o === 'JP' || o === 'JAPAN') return 'Japan';
  if (o === 'CN' || o === 'CHINA') return 'China';
  if (o === 'NL' || o === 'NETHERLANDS') return 'Netherlands';
  return 'USA';
}

function formatTrimName(trim) {
  if (!trim || trim.toString().trim().toUpperCase() === 'NIL' || trim.toString().trim() === '-') {
    return 'Base / Standard';
  }
  return trim.toString().trim().toUpperCase();
}

export default function PresetSelector({ onSelectVehicle }) {
  const [activeBrand, setActiveBrand] = useState(null)
  const [activeModel, setActiveModel] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Group compiled entries dynamically (Runs ONCE on mount)
  const AVAILABLE_BRANDS = useMemo(() => {
    const registry = {}

    PRESET_DATA.forEach(vehicle => {
      const makeVal = vehicle.make || vehicle.Make;
      const modelVal = vehicle.model || vehicle.Model;
      const yearVal = vehicle.year || vehicle['Year of Manufacture'];

      if (!makeVal || !modelVal || !yearVal) return

      const makeClean = makeVal.toString().toLowerCase().trim()
      if (
        makeClean.includes('exchange') || 
        makeClean.includes('rate') || 
        makeClean.includes('excange') || 
        makeClean === 'make'
      ) {
        return
      }

      // Format clean brand display names
      let brandDisplayName = makeVal.toString().trim()
      if (brandDisplayName.toLowerCase() === 'mercedes_benz' || brandDisplayName.toLowerCase() === 'mercedes benz') {
        brandDisplayName = 'Mercedes-Benz'
      }

      const brandKey = brandDisplayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

      if (!registry[brandKey]) {
        registry[brandKey] = {
          name: brandDisplayName,
          modelsMap: {}
        }
      }

      const modelNameClean = modelVal.toString().trim()
      if (!registry[brandKey].modelsMap[modelNameClean]) {
        registry[brandKey].modelsMap[modelNameClean] = {
          id: modelNameClean.toLowerCase().replace(/\s+/g, '_'),
          name: modelNameClean,
          yearsMap: {}
        }
      }

      if (!registry[brandKey].modelsMap[modelNameClean].yearsMap[yearVal]) {
        registry[brandKey].modelsMap[modelNameClean].yearsMap[yearVal] = []
      }
      
      registry[brandKey].modelsMap[modelNameClean].yearsMap[yearVal].push(vehicle)
    })

    const formattedRegistry = {}
    Object.keys(registry).sort().forEach(brandKey => {
      const modelsList = Object.values(registry[brandKey].modelsMap).map(model => {
        const sortedYears = Object.keys(model.yearsMap)
          .map(Number)
          .sort((a, b) => b - a)

        return {
          ...model,
          years: sortedYears,
          rawYearsData: model.yearsMap
        }
      }).sort((a, b) => a.name.localeCompare(b.name))

      formattedRegistry[brandKey] = {
        name: registry[brandKey].name,
        models: modelsList
      }
    })

    return formattedRegistry
  }, [])

  // Filter brands and models dynamically when user types in search
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return AVAILABLE_BRANDS

    const q = searchQuery.toLowerCase().trim()
    const result = {}

    Object.keys(AVAILABLE_BRANDS).forEach(brandKey => {
      const brand = AVAILABLE_BRANDS[brandKey]
      const brandMatches = brand.name.toLowerCase().includes(q)

      const matchingModels = brand.models.filter(model => 
        brandMatches || model.name.toLowerCase().includes(q)
      )

      if (matchingModels.length > 0) {
        result[brandKey] = {
          name: brand.name,
          models: matchingModels
        }
      }
    })

    return result
  }, [AVAILABLE_BRANDS, searchQuery])

  const handleYearSelectionLocal = (yearPresets) => {
    if (!yearPresets || yearPresets.length === 0) return

    // If multiple trims exist for this year, prioritize standard/base or take the first one
    let selectedVehicle = yearPresets.find(p => {
      const t = (p.trim || p['Trim Level'] || '').toString().toUpperCase();
      return t === 'NIL' || t === 'BASE' || t === 'STANDARD' || !t;
    }) || yearPresets[0];

    const makeVal = selectedVehicle.make || selectedVehicle.Make || ''
    let makeFormatted = makeVal.toString().toUpperCase().trim()
    if (makeFormatted === 'MERCEDES_BENZ' || makeFormatted === 'MERCEDES BENZ') {
      makeFormatted = 'MERCEDES-BENZ'
    }

    const rawTrim = selectedVehicle.trim || selectedVehicle['Trim Level'] || ''
    const rawOrigin = selectedVehicle.origin || selectedVehicle['Origin Code'] || ''
    const rawHdv = selectedVehicle.hdv || selectedVehicle.HDV || ''
    const rawYear = selectedVehicle.year || selectedVehicle['Year of Manufacture'] || ''
    const rawModel = selectedVehicle.model || selectedVehicle.Model || ''
    const rawEngine = selectedVehicle.engine || selectedVehicle.Engine || ''
    const rawBody = selectedVehicle.bodyType || selectedVehicle.BodyType || 'Sedan'

    onSelectVehicle({
      make: makeFormatted,
      model: rawModel.toString().toUpperCase().trim(),
      year: String(rawYear),
      bodyType: rawBody,
      engine: rawEngine,
      trim: formatTrimName(rawTrim),
      hdv: rawHdv,
      origin: normalizeOrigin(rawOrigin)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* Quick Search Input */}
      <input
        type="text"
        placeholder="🔍 Search make or model (e.g. Yaris, Tacoma, Kona)..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          fontSize: '12px',
          boxSizing: 'border-box'
        }}
      />

      {/* Main Panel Viewport Box */}
      <div style={{ maxHeight: '560px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {Object.keys(filteredBrands).length === 0 ? (
          <div style={{ fontSize: '12px', color: '#64748b', padding: '12px', textAlign: 'center' }}>
            No matching vehicle presets found.
          </div>
        ) : (
          Object.keys(filteredBrands).map((brandKey) => {
            const brand = filteredBrands[brandKey];
            const isBrandOpen = activeBrand === brandKey || Boolean(searchQuery.trim());

            return (
              <div key={brandKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => { setActiveBrand(isBrandOpen && !searchQuery ? null : brandKey); setActiveModel(null); }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                    backgroundColor: isBrandOpen ? '#05643c' : '#ffffff', color: isBrandOpen ? '#ffffff' : '#111827',
                    fontWeight: '600', fontSize: '13px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', 
                    cursor: 'pointer', transition: 'all 0.15s ease-in-out'
                  }}
                >
                  <span>🚘 {brand.name}</span>
                  <span>{isBrandOpen ? '▲' : '▼'}</span>
                </button>

                {isBrandOpen && (
                  <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {brand.models.map((model) => {
                      const isModelOpen = activeModel?.id === model.id || Boolean(searchQuery.trim());
                      return (
                        <div key={model.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            onClick={() => setActiveModel(isModelOpen && !searchQuery ? null : model)}
                            style={{
                              width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0',
                              backgroundColor: isModelOpen ? '#f0fdf4' : '#f8fafc', fontSize: '12px', fontWeight: '500',
                              color: '#334155', textAlign: 'left', display: 'flex', justifyContent: 'space-between', cursor: 'pointer'
                            }}
                          >
                            <span>🔹 {model.name}</span>
                            <span style={{ fontSize: '11px', color: isModelOpen ? '#05643c' : '#64748b' }}>
                              {isModelOpen ? 'Hide Years' : 'Expand'}
                            </span>
                          </button>

                          {isModelOpen && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                              {model.years.map((year) => {
                                const yearPresets = model.rawYearsData[year];
                                return (
                                  <button
                                    key={year}
                                    onClick={() => handleYearSelectionLocal(yearPresets)}
                                    style={{
                                      padding: '8px 2px', fontSize: '11px', fontWeight: '700', borderRadius: '4px',
                                      border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9',
                                      color: '#334155', cursor: 'pointer', textAlign: 'center',
                                      transition: 'all 0.1s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#05643c'; e.currentTarget.style.background = '#e2f5ec'; e.currentTarget.style.color = '#05643c'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
                                  >
                                    {year}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}