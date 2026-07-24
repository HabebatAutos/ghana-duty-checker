'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTokens } from './Context/TokenContext'
import PresetSelector from './components/PresetSelector'
import PricingModal from './components/PricingModal'
const CONTINENT_ORIGIN_GROUPS = [
  {
    continent: 'North America',
    countries: [
      { label: 'USA', value: 'USA', code: 'US', currency: 'USD' },
      { label: 'Canada', value: 'Canada', code: 'CA', currency: 'CAD' }
    ]
  },
  {
    continent: 'Europe',
    countries: [
      { label: 'Germany', value: 'Germany', code: 'DE', currency: 'EUR' },
      { label: 'Belgium', value: 'Belgium', code: 'BE', currency: 'EUR' },
      { label: 'UK', value: 'UK', code: 'GB', currency: 'GBP' },
      { label: 'Netherlands', value: 'Netherlands', code: 'NL', currency: 'EUR' }
    ]
  },
  {
    continent: 'Asia & Middle East',
    countries: [
      { label: 'Japan', value: 'Japan', code: 'JP', currency: 'JPY' },
      { label: 'South Korea', value: 'South Korea', code: 'KR', currency: 'KRW' },
      { label: 'China', value: 'China', code: 'CN', currency: 'CNY' },
      { label: 'UAE', value: 'UAE', code: 'AE', currency: 'AED' }
    ]
  }
];
function getOriginCode(originValue) {
  for (const group of CONTINENT_ORIGIN_GROUPS) {
    const found = group.countries.find(c => c.value === originValue);
    if (found) return found.code;
  }
  return 'US';
}
function findContinentForCountry(countryValue) {
  for (const group of CONTINENT_ORIGIN_GROUPS) {
    if (group.countries.some(c => c.value === countryValue)) {
      return group.continent;
    }
  }
  return 'North America';
}
function fmtGhs(n) {
  return 'GHC ' + parseFloat(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtUsd(n) {
  return '$' + parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function normaliseBodyType(nhtsa) {
  if (!nhtsa) return 'Sedan';
  const b = nhtsa.toLowerCase();
  if (b.includes('pickup') || b.includes('truck')) return 'Pickup Truck';
  if (b.includes('suv') || b.includes('sport utility') || b.includes('multipurpose') || b.includes('multi-purpose')) return 'SUV';
  if (b.includes('van') || b.includes('minivan')) return 'Van / Minivan';
  if (b.includes('hatchback')) return 'Hatchback';
  if (b.includes('coupe')) return 'Coupe';
  if (b.includes('bus') || b.includes('minibus')) return 'Bus';
  if (b.includes('electric')) return 'Electric Vehicle (EV)';
  return 'Sedan';
}
export default function Home() {
  const { tokens, spendToken } = useTokens()
  const [mode, setMode] = useState('free');
  const [activeContinent, setActiveContinent] = useState('North America');
  const [origin, setOrigin] = useState('USA');
  const [condition, setCondition] = useState('used'); 
  const [actualCost, setActualCost] = useState('');    
  const [fields, setFields] = useState({
    year: '', make: '', model: '', trim: '', engine: '', bodyType: 'Sedan'
  });
  const [vin, setVin] = useState('');
  const [vinData, setVinData] = useState(null);
  const [vinStatus, setVinStatus] = useState('');
  const [vinError, setVinError] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [freight, setFreight] = useState('1500');
  const [calcStatus, setCalcStatus] = useState('');
  const [calcError, setCalcError] = useState('');
  
  const [masterLineup, setMasterLineup] = useState([]);
  const [dropdownTrims, setDropdownTrims] = useState([]);
  const [lineupMeta, setLineupMeta] = useState({ isFallback: false, availableOrigins: [] });
  
  const [lineupLoading, setLineupLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  // INTERACTIVE POPUP MODAL HOOK STATES
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadTargetType, setLeadTargetType] = useState(''); 
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [clearingAgentLeadSent, setClearingAgentLeadSent] = useState(false);
  const [inspectionLeadSent, setInspectionLeadSent] = useState(false);
  async function fetchLineupForFields(targetFields, targetOrigin, allowAIFallback) {
    if (!targetFields.year || !targetFields.make || !targetFields.model) return;
    setLineupLoading(true);
    setCalcError('');
    setResult(null);
    setMasterLineup([]);
    setDropdownTrims([]);
    setLineupMeta({ isFallback: false, availableOrigins: [] });
    const originCode = getOriginCode(targetOrigin);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: targetFields.year,
          make: targetFields.make,
          model: targetFields.model,
          engine: targetFields.engine,
          bodyType: targetFields.bodyType,
          origin: targetOrigin,
          originCode: originCode,
          freight,
          condition,
          isLineupQuery: true,
          isBackgroundSync: !allowAIFallback 
        }),
      });
      const data = await res.json();
      if (res.ok && data.isLineup && data.lineup) {
        setMasterLineup(data.lineup);
        setLineupMeta({
          isFallback: !!data.isFallback,
          availableOrigins: data.availableOrigins || []
        });
        
        const extractedTrims = data.lineup.map(item => {
          const modelName = targetFields.model.toUpperCase();
          let cleanLabel = item.trim.toUpperCase();
          if (cleanLabel.startsWith(modelName)) {
            cleanLabel = cleanLabel.replace(modelName, '').trim();
          }
          return cleanLabel;
        });
        
        const uniqueOptions = Array.from(new Set(extractedTrims)).filter(Boolean).sort();
        setDropdownTrims(uniqueOptions);
      } else if (data.error) {
        setCalcError(data.error);
      }
    } catch (err) {
      console.error('Lineup integration failed:', err.message);
      setCalcError('Connection failed. Please check your internet network and try again.');
    } finally {
      setLineupLoading(false);
    }
  }
  function handleSelectOrigin(newOrigin) {
    setOrigin(newOrigin);
    setResult(null);
    setClearingAgentLeadSent(false);
    setInspectionLeadSent(false);
    if (fields.year && fields.make && fields.model) {
      fetchLineupForFields(fields, newOrigin, false);
    }
  }
  function handleLoadVehiclePreset(payload) {
    setMode('free');
    const newFields = {
      year: String(payload.year || ''),
      make: payload.make || '',
      model: payload.model || '',
      trim: '', 
      engine: payload.engine || '',
      bodyType: payload.bodyType || 'Sedan'
    };
    const targetOrigin = payload.origin || 'USA';
    setFields(newFields);
    setOrigin(targetOrigin);
    setActiveContinent(findContinentForCountry(targetOrigin));
    setPurchasePrice(payload.hdv || '');
    setCondition('used'); 
    setVin('');
    setVinData(null);
    setCalcError('');
    setResult(null);
    setMasterLineup([]);
    setDropdownTrims([]);
    setClearingAgentLeadSent(false);
    setInspectionLeadSent(false);
    fetchLineupForFields(newFields, targetOrigin, false);
  }
  function handleManualCalculateTrigger() {
    if (!fields.year || !fields.make || !fields.model) {
      setCalcError('Please enter the Year, Make, and Model of the vehicle.');
      return;
    }
    setResult(null);
    setClearingAgentLeadSent(false);
    setInspectionLeadSent(false);
    fetchLineupForFields(fields, origin, true);
  }
  async function decodeVin() {
    const v = vin.trim().toUpperCase();
    if (v.length !== 17) { setVinError('Please enter a full 17-character VIN (Chassis Number).'); return; }

    if (tokens < 1) {
      setVinError('You have no tokens left. Please buy tokens to use automatic VIN lookup.');
      setIsPricingModalOpen(true);
      return;
    }
    setVinError('');
    setVinStatus('Searching VIN in official database...');
    setVinData(null);
    setResult(null);
    setMasterLineup([]);
    setDropdownTrims([]);
    setClearingAgentLeadSent(false);
    setInspectionLeadSent(false);

    try {
      const res = await fetch(`/api/decode-vin?vin=${v}`);
      const data = await res.json();

      if (!res.ok) {
        setVinStatus('');
        setMode('free');
        setVinError('Could not auto-fill details for this VIN. Please enter car details manually.');
        return;
      }

      // spendToken is now async and server-backed (see TokenContext).
      // Must await it and check the result — proceeding on a rejected
      // spend would let a lookup through without actually deducting
      // a token from the real database balance.
      const spendOk = await spendToken();
      if (!spendOk) {
        setVinStatus('');
        setVinError('Could not process token payment. Please try again or buy more tokens.');
        setIsPricingModalOpen(true);
        return;
      }

      const v2 = data.vehicle;
      const newFields = {
        year: v2.year || '',
        make: v2.make || '',
        model: v2.model || '',
        trim: '', 
        engine: v2.engine || '',
        bodyType: normaliseBodyType(v2.bodyType),
      };
      setFields(newFields);
            
      let detectedOrigin = 'USA';
      if (v2.plantCountry) {
        const plant = v2.plantCountry.toLowerCase();
        if (plant.includes('canada') || v.startsWith('2')) detectedOrigin = 'Canada';
        else if (plant.includes('belgium')) detectedOrigin = 'Belgium';
        else if (plant.includes('germany') || v.startsWith('W')) detectedOrigin = 'Germany';
        else if (plant.includes('netherlands')) detectedOrigin = 'Netherlands';
        else if (plant.includes('japan') || v.startsWith('J')) detectedOrigin = 'Japan';
        else if (plant.includes('korea') || v.startsWith('K')) detectedOrigin = 'South Korea';
        else if (plant.includes('china') || v.startsWith('L')) detectedOrigin = 'China';
        else if (plant.includes('united kingdom') || v.startsWith('S')) detectedOrigin = 'UK';
        else if (plant.includes('united arab emirates') || plant.includes('uae')) detectedOrigin = 'UAE';
      }
      setOrigin(detectedOrigin);
      setActiveContinent(findContinentForCountry(detectedOrigin));
      setVinData(v2);
      setVinStatus('');
      fetchLineupForFields(newFields, detectedOrigin, false);
    } catch (e) {
      setVinStatus('');
      setVinError('VIN lookup timed out. Please try again or fill in the details manually.');
    }
  }
  async function runFinalCalculation(selectedOption) {
    setCalcError('');
    setCalcStatus('Calculating itemized customs duty and port clearing taxes...');
         
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: fields.year,
          make: fields.make,
          model: fields.model,
          trim: selectedOption.trim,
          engine: fields.engine,
          bodyType: fields.bodyType,
          origin,
          originCode: getOriginCode(origin),
          purchasePrice, 
          freight,
          condition,
          customPurchasePriceUsd: condition === 'used' && actualCost ? actualCost : null,
          vin: vinData?.vin || null,
          selectedPrice: selectedOption.price,
          selectedCurrency: selectedOption.currency,
          selectedSource: selectedOption.source,
          selectedTrim: selectedOption.trim,
          isLineupQuery: false,
          isBackgroundSync: false 
        }),
      });
            
      const data = await res.json();
      setCalcStatus('');
            
      if (!res.ok) {
        setCalcError(data.error || 'Calculation failed. Please check your inputs and try again.');
        return;
      }
      setResult(data.result);
    } catch (e) {
      setCalcStatus('');
      setCalcError('Connection error. Please check your network connection.');
    }
  }
  async function downloadPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result,
          vehicleData: { ...fields, origin, originCode: getOriginCode(origin), vin: vinData?.vin || null },
          isLeadSubmitted: clearingAgentLeadSent || inspectionLeadSent
        }),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CEDIDUTY-Report-${result.vehicle_label?.replace(/\s+/g, '-') || 'Statement'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download PDF. Please try again in a few moments.');
    }
    setPdfLoading(false);
  }
  function switchMode(m) {
    setMode(m);
    setResult(null);
    setMasterLineup([]);
    setDropdownTrims([]);
    setCalcError('');
    if (m === 'free') setVinData(null);
  }
  function triggerOpenLeadModal(serviceTypeString) {
    setLeadTargetType(serviceTypeString);
    setLeadError('');
    setLeadForm({ name: '', phone: '', email: '', notes: '' });
    setIsLeadModalOpen(true);
  }
  async function executeLeadFormSubmission(e) {
    e.preventDefault();
    setLeadError('');
    setLeadSubmitting(true);
    try {
      const response = await fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadDetails: { ...leadForm, type: leadTargetType },
          vehicleContext: { ...fields, origin, originCode: getOriginCode(origin), vin: vinData?.vin || null },
          calculationResult: result
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLeadError(data.error || 'Could not send request. Please try again.');
        setLeadSubmitting(false);
        return;
      }
      if (leadTargetType === 'Clearing Agent Support') {
        setClearingAgentLeadSent(true);
      } else {
        setInspectionLeadSent(true);
      }
      setIsLeadModalOpen(false);
      alert('Request sent successfully! An agent will get in touch with you shortly.');
    } catch (err) {
      setLeadError('Network connection timeout. Please try submitting again.');
    } finally {
      setLeadSubmitting(false);
    }
  }
  const displayedLineupCards = masterLineup.filter(item => {
    if (!fields.trim) return true;
    const itemTrimUpper = item.trim.toUpperCase();
    const searchTrimUpper = fields.trim.toUpperCase();
    return itemTrimUpper.includes(searchTrimUpper) || searchTrimUpper.includes(itemTrimUpper);
  });
  const d = result?.duties || {};
  return (
    <div suppressHydrationWarning>
      <style suppressHydrationWarning>{`
        .premium-input-field { transition: all 0.2s ease-in-out !important; border: 1px solid #d1d5db !important; border-radius: 8px !important; width: 100% !important; box-sizing: border-box !important; }
        .premium-input-field:focus { border-color: #05643c !important; box-shadow: 0 0 0 3px rgba(5, 100, 60, 0.18) !important; outline: none !important; }
        .premium-card-wrapper { border-radius: 16px !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05) !important; background: #ffffff !important; overflow: hidden; width: 100%; box-sizing: border-box; }
        .premium-interactive-tab { transition: all 0.2s ease !important; border-radius: 6px !important; }
        .premium-interactive-tab.active { box-shadow: inset 0 2px 4px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(5, 100, 60, 0.2) !important; }
        .mode-tab:not(.active) { background-color: transparent !important; color: #334155 !important; }
        .report-section-title { font-size: 14px; font-weight: 750; color: #1e293b; background: #f8fafc; padding: 8px 12px; margin-top: 24px; border-left: 4px solid #05643c; border-radius: 0 4px 4px 0; }
        .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        .report-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
        .td-label { color: #475569; }
        .td-value { text-align: right; font-weight: 600; color: #0f172a; }
        .total-row td { background: #f0fdf4; font-weight: 700 !important; color: #166534 !important; border-top: 2px solid #bbf7d0; }
        .marketplace-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #fafafa; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; transition: all 0.2s ease; }
        .marketplace-card:hover { border-color: #05643c; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .modal-overlay-blur { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; }
        .modal-inner-surface { background: #ffffff; width: 100%; max-width: 460px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); overflow: hidden; animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        /* 2-COLUMN APP CONTAINER GRID ARCHITECTURE */
        .app-container-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
          padding: 0 16px;
          box-sizing: border-box;
        }
        /* Mobile: presets, then calculator, then how it works (in that order).
           sidebar-wrap dissolves via display:contents so its two children
           become direct grid items and can be ordered independently. */
        .sidebar-wrap { display: contents; }
        .presets-item { order: 1; }
        .calculator-item { order: 2; }
        .howitworks-item { order: 3; }
        @media (min-width: 1024px) {
          .app-container-grid {
            grid-template-columns: minmax(0, 1.8fr) 380px;
            gap: 28px;
            padding: 0 24px;
            align-items: start;
          }
          /* Desktop: calculator sits alone in the wide left column (no
             spanning). sidebar-wrap becomes a real flex column that stacks
             presets above how it works in the narrow right column. */
          .calculator-item { order: initial; }
          .sidebar-wrap {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .presets-item { order: initial; }
          .howitworks-item { order: initial; }
        }
        /* FORM GRIDS RESPONSIVE */
        .responsive-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .responsive-form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        /* METRICS GRID RESPONSIVE */
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin: 20px 0;
        }
        @media (min-width: 640px) {
          .metrics-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        /* MARKETPLACE & CARDS GRIDS */
        .responsive-two-cols {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .responsive-two-cols {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
      {/* BACKGROUND IMAGE & OVERLAY */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -2, overflow: 'hidden', backgroundColor: '#090d16' }}>
        <Image src="/bg-hero.jpg" alt="Tema Harbor Terminal Background" fill priority quality={95} style={{ objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.20) 0%, rgba(15, 23, 42, 0.40) 100%)' }} />
      </div>
      <div className="hero" style={{ background: 'linear-gradient(135deg, #05643c, #047857)', padding: '32px 16px', color: '#ffffff', textAlign: 'center', marginBottom: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        
        {/* HERO BADGE CONTAINER */}
<div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.12)', padding: '8px 24px', borderRadius: '50px', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
  <div style={{
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
  }}>
    <Image
      src="/logo.png"
      alt="CEDIDUTY Official Logo"
      width={70}
      height={70}
      priority
      style={{
        width: '135%',
        height: '135%',
        objectFit: 'cover',
        imageRendering: '-webkit-optimize-contrast'
      }}
    />
  </div>
  <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.06em', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>CEDIDUTY</span>
</div>
        <h1 style={{ margin: '0 0 6px 0', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '800', letterSpacing: '-0.025em', textAlign: 'center', width: '100%' }}>
          Ghana Vehicle Import Duty Calculator
        </h1>
        <p style={{ margin: '0 auto 16px auto', fontSize: '14px', opacity: 0.95, fontWeight: '400', textAlign: 'center', maxWidth: '600px', lineHeight: '1.4' }}>
          Instant GRA Customs Tax & Port Duty Estimator • Compliant with Customs Act 2015 (Act 891)
        </p>
        
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
          {['Official GRA Formulas', 'Live BoG Exchange Rates', 'Instant VIN Lookup', '100% Free Duty Reports'].map((badge) => (
            <span key={badge} style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(255, 255, 255, 0.16)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(4px)' }}>
              {badge}
            </span>
          ))}
        </div>
      </div>
      <div className="app-container-grid">
        
        {/* MAIN CALCULATOR FORM & RESULTS (Wide column on desktop, middle on mobile) */}
        <div className="page-content calculator-item" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="premium-card-wrapper">
            <div className="card-body" style={{ padding: '20px' }}>
              
              <div className="mode-tabs" style={{ display: 'flex', width: '100%', borderRadius: '10px', padding: '4px', background: '#f1f5f9', marginBottom: '20px', boxSizing: 'border-box' }}>
                <button 
                  className={`mode-tab premium-interactive-tab ${mode === 'free' ? 'active' : ''}`} 
                  onClick={() => switchMode('free')}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', 
                    backgroundColor: mode === 'free' ? '#05643c' : 'transparent', color: mode === 'free' ? '#ffffff' : '#334155' 
                  }}
                >
                  📋 Manual Search (Free)
                </button>
                <button 
                  className={`mode-tab premium-interactive-tab ${mode === 'premium' ? 'active' : ''}`} 
                  onClick={() => switchMode('premium')}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', 
                    backgroundColor: mode === 'premium' ? '#0f172a' : 'transparent', color: mode === 'premium' ? '#ffffff' : '#334155', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' 
                  }}
                >
                  ⚡ Instant VIN Autofill 
                  <span style={{ backgroundColor: mode === 'premium' ? '#e2e8f0' : '#cbd5e1', color: '#0f172a', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>
                    1 TOKEN
                  </span>
                </button>
              </div>
              {mode === 'premium' && (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Automatic VIN Search</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', lineHeight: '1.4' }}>
                    Type in your 17-character Chassis Number (VIN) to automatically fetch your car specifications. Uses 1 token from your balance.
                  </div>
                  <div className="form-group full" style={{ marginBottom: 0 }}>
                    <div className="vin-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input className="form-input premium-input-field" type="text" placeholder="e.g. 1FTEW1EP9HFC23632" maxLength={17} value={vin} onChange={e => setVin(e.target.value.toUpperCase())} style={{ flex: 1, minWidth: '200px', padding: '10px 12px' }} />
                      <button className="vin-decode-btn" style={{ borderRadius: '8px', padding: '10px 18px', background: '#05643c', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={decodeVin}>Decode VIN</button>
                    </div>
                    {vinStatus && <div className="status-bar" style={{ marginTop: '8px', fontSize: '12px', color: '#05643c' }}>{vinStatus}</div>}
                    
                    {vinError && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>{vinError}</span>
                        {tokens < 1 && (
                          <button
                            type="button"
                            onClick={() => setIsPricingModalOpen(true)}
                            style={{ background: '#05643c', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Buy Tokens 🪙
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {mode === 'free' && (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', fontWeight: '500', marginBottom: '20px', lineHeight: '1.4' }}>
                  💡 <strong>Free Mode Active:</strong> Select a car from the quick presets or type your car details below to calculate duty instantly for free.
                </div>
              )}
              <div className="responsive-form-grid">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Year of Manufacture *</label>
                  <input className="form-input premium-input-field" type="number" placeholder="e.g. 2022" value={fields.year} onChange={e => setFields(p => ({ ...p, year: e.target.value }))} disabled={mode === 'premium'} style={{ padding: '10px 12px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Car Make *</label>
                  <input className="form-input premium-input-field" type="text" placeholder="e.g. Hyundai, Toyota" value={fields.make} onChange={e => setFields(p => ({ ...p, make: e.target.value }))} disabled={mode === 'premium'} style={{ padding: '10px 12px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Car Model *</label>
                  <input className="form-input premium-input-field" type="text" placeholder="e.g. Sonata, RAV4" value={fields.model} onChange={e => setFields(p => ({ ...p, model: e.target.value }))} disabled={mode === 'premium'} style={{ padding: '10px 12px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Trim Variant (Optional)</label>
                  <input 
                    className="form-input premium-input-field" 
                    type="text" 
                    list="available-trim-options" 
                    placeholder={dropdownTrims.length > 0 ? 'Select trim variant...' : 'Optional — Leave blank'}
                    value={fields.trim} 
                    onChange={e => setFields(p => ({ ...p, trim: e.target.value }))} 
                    style={{ padding: '10px 12px' }}
                  />
                  <datalist id="available-trim-options">
                    {dropdownTrims.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Engine Capacity Size</label>
                  <input className="form-input premium-input-field" type="text" placeholder="Optional — e.g. 2.0L" value={fields.engine} onChange={e => setFields(p => ({ ...p, engine: e.target.value }))} style={{ padding: '10px 12px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Body Type</label>
                  <select className="form-select premium-input-field" value={fields.bodyType} onChange={e => setFields(p => ({ ...p, bodyType: e.target.value }))} style={{ padding: '10px 12px' }}>
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Pickup Truck</option>
                    <option>Van / Minivan</option>
                    <option>Hatchback</option>
                  </select>
                </div>
              </div>
              <div className="responsive-form-grid" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Customs Base Price / MSRP (USD)</label>
                  <input className="form-input premium-input-field" type="number" placeholder="Estimated original price" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} style={{ padding: '10px 12px' }} />
                </div>
                {condition === 'used' && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Actual Purchase Price (USD)</label>
                    <input className="form-input premium-input-field" type="number" placeholder="What you paid for the car" value={actualCost} onChange={e => setActualCost(e.target.value)} style={{ padding: '10px 12px' }} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Freight Shipping Cost (USD)</label>
                  <input className="form-input premium-input-field" type="number" value={freight} onChange={e => setFreight(e.target.value)} style={{ padding: '10px 12px' }} />
                </div>
              </div>
              {/* REACTIVE CONTINENT & COUNTRY ORIGIN SELECTOR */}
              <div className="form-group full" style={{ marginTop: 16 }}>
                <label className="form-label" style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '12px' }}>
                  <span>Country Shipping From (Origin Code Filter) *</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#05643c' }}>
                    Active Origin: {origin} [{getOriginCode(origin)}]
                  </span>
                </label>
                
                {/* Tier 1: Continent Region Tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {CONTINENT_ORIGIN_GROUPS.map(group => (
                    <button
                      key={group.continent}
                      type="button"
                      onClick={() => setActiveContinent(group.continent)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: activeContinent === group.continent ? '1px solid #05643c' : '1px solid #cbd5e1',
                        backgroundColor: activeContinent === group.continent ? '#05643c' : '#f8fafc',
                        color: activeContinent === group.continent ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        flex: '1 1 auto',
                        textAlign: 'center'
                      }}
                    >
                      {group.continent}
                    </button>
                  ))}
                </div>
                {/* Tier 2: Country Selector Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '10px', background: '#f1f5f9', borderRadius: '10px' }}>
                  {CONTINENT_ORIGIN_GROUPS.find(g => g.continent === activeContinent)?.countries.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => handleSelectOrigin(c.value)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: origin === c.value ? '2px solid #05643c' : '1px solid #cbd5e1',
                        backgroundColor: origin === c.value ? '#ffffff' : 'transparent',
                        color: origin === c.value ? '#05643c' : '#334155',
                        cursor: 'pointer',
                        boxShadow: origin === c.value ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      {c.label} ({c.code})
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="calc-btn" style={{ flex: 1, borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '700' }} onClick={handleManualCalculateTrigger}>
                  Fetch Trims & Calculate Duty
                </button>
              </div>
              {calcStatus && <div className="status-bar" style={{ marginTop: '10px', fontSize: '12px', color: '#05643c' }}>{calcStatus}</div>}
              {calcError && <div className="error-msg" style={{ marginTop: '10px', fontSize: '12px', color: '#dc2626' }}>{calcError}</div>}
            </div>
          </div>
          {lineupLoading && !result && (
            <div className="premium-card-wrapper" style={{ padding: '30px', textAlign: 'center', color: '#4b5563' }}>
              <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #05643c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>
                Fetching official GRA valuation records for {fields.year} {fields.make} {fields.model} [{getOriginCode(origin)}]...
              </p>
            </div>
          )}
          {displayedLineupCards.length > 0 && !result && !lineupLoading && (
            <div className="premium-card-wrapper" style={{ padding: '20px' }}>
              
              {lineupMeta.isFallback ? (
                <div style={{ padding: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', marginBottom: '16px', color: '#92400e' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>
                    ⚠️ No Direct GRA Records Found for {origin} [{getOriginCode(origin)}]
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', lineHeight: '1.4', color: '#b45309' }}>
                    Showing available valuation variants recorded from other export hubs: <strong>{lineupMeta.availableOrigins.join(', ')}</strong>.
                  </p>
                </div>
              ) : (
                <div className="result-header" style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a' }}>
                    Select Trim Level for {fields.year} {fields.make} {fields.model} [{getOriginCode(origin)}]
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Showing {displayedLineupCards.length} official GRA variants recorded for origin code: <strong>{getOriginCode(origin)} ({origin})</strong>.
                  </p>
                </div>
              )}
              <div className="responsive-two-cols">
                {displayedLineupCards.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => runFinalCalculation(opt)}
                    style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                        <h4 style={{ color: '#05643c', margin: 0, fontSize: '14px', fontWeight: '700' }}>{opt.trim}</h4>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: opt.originCode === getOriginCode(origin) ? '#dcfce7' : '#f1f5f9', color: opt.originCode === getOriginCode(origin) ? '#15803d' : '#475569', whiteSpace: 'nowrap' }}>
                          {opt.originCode || getOriginCode(origin)} SPEC
                        </span>
                      </div>
                      <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '12px' }}>
                        {opt.body_style || fields.bodyType} {opt.engine ? `— ${opt.engine}` : ''}
                      </p>
                    </div>
                    <p style={{ color: '#111827', margin: '6px 0 0 0', fontSize: '13px', fontWeight: '600' }}>
                      Customs Base Price: <span>{(opt.price ?? 0).toLocaleString()} {opt.currency}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result && (
            <div className="premium-card-wrapper result-card" style={{ padding: '20px' }}>
              <div className="result-header">
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{result.vehicle_label}</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>Customs Exchange Rate: {result.exchange_label} — Tema / Takoradi Port</p>
              </div>
              <div className="metrics-grid">
                <div className="metric-cell" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>CIF Value</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{fmtGhs(result.cif_ghs)}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>({fmtUsd(result.cif_usd)})</div>
                </div>
                <div className="metric-cell" style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: '500' }}>Total Duty & Taxes Payable</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#05643c', marginTop: '2px' }}>{fmtGhs(result.total_duty_ghs)}</div>
                  <div style={{ fontSize: '10px', color: '#78716c' }}>({fmtUsd(result.total_duty_usd)})</div>
                </div>
                <div className="metric-cell" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Estimated Landed Cost</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{fmtUsd(result.landed_cost_usd)}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total budget needed</div>
                </div>
              </div>
              {result.vehicle_age >= 11 && (
                <div className="overage-warning-box" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#fff9e6', borderLeft: '4px solid #d97706', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <div>
                    <h4 style={{ color: '#92400e', margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600' }}>Over-Age Penalty Fee Included</h4>
                    <p style={{ color: '#b45309', margin: '0', fontSize: '12px', lineHeight: '1.4' }}>
                      This car is <strong>{result.vehicle_age} years old</strong>. Cars older than 10 years attract an extra penalty of <strong>{result.overage_rate_label || '0%'}</strong>.
                    </p>
                  </div>
                </div>
              )}
              <div className="report-section-title">Section 1 — Customs CIF Value Breakdown</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="report-table">
                  <tbody>
                    <tr>
                      <td className="td-label">Original Customs Base Price (MSRP / HDV)</td>
                      <td className="td-value">{result.hdv_formatted}</td>
                    </tr>
                    <tr>
                      <td className="td-label">Age Depreciation Discount ({result.depreciation_pct}%)</td>
                      <td className="td-value">
                        {result.hdv_origin && result.depreciation_pct ? (result.hdv_origin * result.depreciation_pct / 100).toLocaleString() : '0'} {result.hdv_currency}
                      </td>
                    </tr>
                    <tr>
                      <td className="td-label">Depreciated Car Value</td>
                      <td className="td-value">{(result.depreciated_value_origin ?? 0).toLocaleString()} {result.hdv_currency}</td>
                    </tr>
                    <tr>
                      <td className="td-label">Freight Shipping Fee ({origin})</td>
                      <td className="td-value">{(result.freight_origin ?? 0).toLocaleString()} {result.hdv_currency}</td>
                    </tr>
                    <tr>
                      <td className="td-label">Marine Insurance (~1%)</td>
                      <td className="td-value">{(result.insurance_origin ?? 0).toLocaleString()} {result.hdv_currency}</td>
                    </tr>
                    <tr className="total-row">
                      <td className="td-label">Total Calculated CIF Value</td>
                      <td className="td-value">{(result.cif_origin ?? 0).toLocaleString()} {result.hdv_currency} = {fmtGhs(result.cif_ghs)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="report-section-title">Section 2 — Itemized Port Taxes & Duties (GRA Act 891)</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="report-table">
                  <tbody>
                    {[
                      ['Import Duty Rate (10%)', d.import_duty],
                      ['National Health Insurance Levy (NHIL 2.5%)', d.nhil],
                      ['GETFund Levy (2.5%)', d.getfund],
                      ['Import Value Added Tax (VAT 15%)', d.import_vat],
                      ['ECOWAS Community Levy (0.5%)', d.ecowas],
                      ['Vehicle Examination Fee (1%)', d.exam_fee],
                      ['Network & Processing Service Charge (0.4%)', d.network_charges],
                      ['  Network Service NHIL Allocation', d.network_nhil],
                      ['  Network Service GETFund Allocation', d.network_getfund],
                      ['  Network Service Processing VAT', d.network_vat],
                      ['Special Import Levy (2%)', d.special_import_levy],
                      ['EXIM Bank Development Levy (0.75%)', d.exim_levy],
                      ['African Union Levy (0.2%)', d.au_levy],
                      ['Vehicle Inspection Certification Fee', d.cert_fee],
                      ['Ghana Shippers Authority Processing Fee', d.shippers_fee],
                      ['Ministry of Trade e-ID Integration Fee', d.moti_fee],
                      ['Port Health & Sanitation Treatment Fee', d.disinfection_fee],
                      [`Over-Age Penalty Charge (${result.overage_rate_label || '0%'})`, d.overage_penalty],
                    ].map(([label, valuation]) => (
                      <tr key={label}>
                        <td className="td-label">{label}</td>
                        <td className="td-value">{fmtGhs(valuation)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td className="td-label">Total Port Clearance Duty & Taxes Payable</td>
                      <td className="td-value">{fmtGhs(result.total_duty_ghs)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="report-section-title">💼 Need Help Clearing Your Car?</div>
              <div className="responsive-two-cols" style={{ marginTop: '12px' }}>
                
                <div className="marketplace-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>TEMA & TAKORADI</span>
                      <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '600' }}>● Active</span>
                    </div>
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>Licensed Clearing Agents</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                      Get connected with trusted, licensed clearing agents at Tema or Takoradi ports to handle documents.
                    </p>
                  </div>
                  <button 
                    onClick={() => triggerOpenLeadModal('Clearing Agent Support')}
                    disabled={clearingAgentLeadSent}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: clearingAgentLeadSent ? '#e2e8f0' : '#05643c', color: clearingAgentLeadSent ? '#64748b' : '#ffffff', fontWeight: '700', fontSize: '12px', cursor: clearingAgentLeadSent ? 'default' : 'pointer' }}
                  >
                    {clearingAgentLeadSent ? '✓ Request Submitted' : 'Connect with Clearing Agents'}
                  </button>
                </div>
                <div className="marketplace-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>VALUATION REVIEW</span>
                      <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '600' }}>● Active</span>
                    </div>
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>Vehicle Valuation & Inspection</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                      Request a physical condition check or dispute an over-estimated valuation at the port.
                    </p>
                  </div>
                  <button 
                    onClick={() => triggerOpenLeadModal('Valuation & Inspection Review')}
                    disabled={inspectionLeadSent}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: inspectionLeadSent ? '#e2e8f0' : '#0f172a', color: inspectionLeadSent ? '#64748b' : '#ffffff', fontWeight: '700', fontSize: '12px', cursor: inspectionLeadSent ? 'default' : 'pointer' }}
                  >
                    {inspectionLeadSent ? '✓ Request Submitted' : 'Request Inspection & Review'}
                  </button>
                </div>
              </div>
              <div className="report-section-title">Section 3 — Total Estimated Investment</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="report-table">
                  <tbody>
                    {[
                      ['Car Purchase Price (FOB)', fmtUsd(result.purchase_price_usd)],
                      ['Freight & Shipping Fee', fmtUsd(result.freight_usd)],
                      ['Marine Insurance', fmtUsd(result.insurance_usd)],
                      ['Total Port Customs Duty & Taxes', fmtUsd(result.total_duty_usd)],
                    ].map(([label, valuation]) => (
                      <tr key={label}>
                        <td className="td-label">{label}</td>
                        <td className="td-value">{valuation}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td className="td-label">Estimated Total Landed Cost</td>
                      <td className="td-value">{fmtUsd(result.landed_cost_usd)} / {fmtGhs(result.landed_cost_ghs)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="disclaimer-box" style={{ background: '#fafafa', border: '1px solid #e2e8f0', padding: '12px', fontSize: '11px', color: '#64748b', borderRadius: '8px', marginTop: '16px', lineHeight: '1.4' }}>
                <strong>Important Notice:</strong> Calculations are based on the Ghana Revenue Authority Customs Act 2015 (Act 891). Figures shown are estimates for planning purposes.
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button className="download-btn" style={{ flex: '1 1 180px', background: '#05643c', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }} onClick={downloadPdf} disabled={pdfLoading}>
                  {pdfLoading ? 'Preparing PDF Report...' : 'Download Official PDF Report'}
                </button>
                <button className="calc-btn" style={{ flex: '1 1 140px', background: '#64748b', color: '#ffffff', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }} onClick={() => setResult(null)}>
                  Calculate Another Car
                </button>
              </div>
            </div>
          )}
        </div>
        {/* SIDEBAR WRAP: dissolves into two independent grid items on mobile
            (so How It Works can be ordered last), becomes a stacked flex
            column beside the calculator on desktop. */}
        <div className="sidebar-wrap">
          {/* QUICK VEHICLE PRESETS (Narrow column on desktop, first on mobile) */}
          <div className="premium-card-wrapper presets-item" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '750', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📊 Quick Vehicle Presets
            </h3>
            <PresetSelector onSelectVehicle={handleLoadVehiclePreset} />
          </div>
          {/* HOW IT WORKS (Narrow column on desktop, last on mobile) */}
          <div className="premium-card-wrapper howitworks-item" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '750', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ℹ️ How It Works
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#4b5563', lineHeight: '1.4' }}>
              <div>
                <strong style={{ color: '#05643c', display: 'block', marginBottom: '2px' }}>1. Enter Vehicle Details</strong>
                Enter your car 17-digit Chassis (VIN) number or pick the make, model, and year manually.
              </div>
              <div>
                <strong style={{ color: '#05643c', display: 'block', marginBottom: '2px' }}>2. Select Origin Country</strong>
                Choose your shipping region and country for correct currency exchange rates.
              </div>
              <div>
                <strong style={{ color: '#05643c', display: 'block', marginBottom: '2px' }}>3. Get Instant Duty Report</strong>
                View the exact itemized GRA duty breakdown, port fees, and total clearing costs.
              </div>
              <div>
                <strong style={{ color: '#05643c', display: 'block', marginBottom: '2px' }}>4. Connect with Agents</strong>
                Connect with licensed clearing agents or request a physical car inspection at Tema or Takoradi port.
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* PRICING MODAL COMPONENT */}
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
      {/* LEAD GENERATION ASSISTANCE MODAL */}
      {isLeadModalOpen && (
        <div className="modal-overlay-blur">
          <div className="modal-inner-surface">
            <div style={{ backgroundColor: '#05643c', padding: '16px 20px', color: '#ffffff', position: 'relative' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', letterSpacing: '0.02em' }}>
                🚀 Request Port Support
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                Service Requested: {leadTargetType}
              </p>
              <button 
                onClick={() => setIsLeadModalOpen(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', color: '#ffffff', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={executeLeadFormSubmission} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Your Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={leadForm.name}
                  onChange={e => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  className="premium-input-field"
                  style={{ padding: '10px', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Phone Number (WhatsApp Active) *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="e.g. +233 24 XXX XXXX"
                  value={leadForm.phone}
                  onChange={e => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="premium-input-field"
                  style={{ padding: '10px', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Email Address *</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. client@example.com"
                  value={leadForm.email}
                  onChange={e => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                  className="premium-input-field"
                  style={{ padding: '10px', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Special Instructions or Questions (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Tell us any specific details about your shipment timeline..."
                  value={leadForm.notes}
                  onChange={e => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="premium-input-field"
                  style={{ padding: '10px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              {leadError && (
                <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>
                  ⚠️ {leadError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={leadSubmitting}
                  style={{ padding: '10px 20px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', border: 'none', backgroundColor: '#05643c', color: '#ffffff', cursor: leadSubmitting ? 'default' : 'pointer', opacity: leadSubmitting ? 0.7 : 1 }}
                >
                  {leadSubmitting ? 'Sending Request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <footer className="footer" style={{ marginTop: '48px', background: 'rgba(15, 23, 42, 0.95)', padding: '24px 20px', color: '#cbd5e1', textAlign: 'center' }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '500' }}>© 2026 CEDIDUTY • Ghana Vehicle Import Duty Calculator</p>
        <p style={{ margin: '0', fontSize: '11px', opacity: 0.8, lineHeight: '1.4' }}>Calculations based on Customs Act 2015 (Act 891) • Estimates for planning purposes only</p>
      </footer>
    </div>
  );
}