// lib/dutyCalculator.js
// Core Ghana Customs duty calculation from first principles
// Based on Customs Act 2015 (Act 891)

export const GHANA_DUTY_RATES = {
  importDuty: 0.10,
  nhil: 0.025,
  getfund: 0.025,
  importVat: 0.15,
  ecowas: 0.005,
  examFee: 0.01,
  networkCharges: 0.004,
  networkNhil: 0.025,
  networkGetfund: 0.025,
  networkVat: 0.15,
  specialImportLevy: 0.02,
  eximLevy: 0.0075,
  auLevy: 0.002,
  certFee: 0.50,        // GHS flat
  shippersFee: 9.00,    // GHS flat
  motiFee: 5.00,        // GHS flat
  disinfectionFeeUsd: 35, // USD, converted to GHS
}

export function getDepreciation(vehicleYear) {
  const currentYear = new Date().getFullYear()
  const age = currentYear - vehicleYear
  if (age <= 2) return { age, rate: 0, label: '0% (0–2 years)' }
  if (age <= 4) return { age, rate: 0.30, label: '30% (3–4 years)' }
  return { age, rate: 0.50, label: '50% (5+ years)' }
}

export function calculateDuties({ msrpUsd, freightUsd, exchangeRate, vehicleYear }) {
  const dep = getDepreciation(vehicleYear)
  const depreciatedValue = msrpUsd * (1 - dep.rate)
  const insuranceUsd = depreciatedValue * 0.01
  const cifUsd = depreciatedValue + freightUsd + insuranceUsd
  const cifGhs = cifUsd * exchangeRate

  const r = GHANA_DUTY_RATES
  const importDuty = cifGhs * r.importDuty
  const nhil = cifGhs * r.nhil
  const getfund = cifGhs * r.getfund
  const importVat = cifGhs * r.importVat
  const ecowas = cifGhs * r.ecowas
  const examFee = cifGhs * r.examFee
  const networkCharges = cifGhs * r.networkCharges
  const networkNhil = networkCharges * r.networkNhil
  const networkGetfund = networkCharges * r.networkGetfund
  const networkVat = networkCharges * r.networkVat
  const specialImportLevy = cifGhs * r.specialImportLevy
  const eximLevy = cifGhs * r.eximLevy
  const auLevy = cifGhs * r.auLevy
  const disinfectionFee = r.disinfectionFeeUsd * exchangeRate

  const totalDutyGhs =
    importDuty + nhil + getfund + importVat + ecowas + examFee +
    networkCharges + networkNhil + networkGetfund + networkVat +
    specialImportLevy + eximLevy + auLevy +
    r.certFee + r.shippersFee + r.motiFee + disinfectionFee

  return {
    vehicleAge: dep.age,
    depreciationRate: dep.rate,
    depreciationLabel: dep.label,
    msrpUsd,
    depreciatedValueUsd: depreciatedValue,
    freightUsd,
    insuranceUsd,
    cifUsd,
    cifGhs,
    exchangeRate,
    duties: {
      importDuty, nhil, getfund, importVat, ecowas, examFee,
      networkCharges, networkNhil, networkGetfund, networkVat,
      specialImportLevy, eximLevy, auLevy,
      certFee: r.certFee, shippersFee: r.shippersFee,
      motiFee: r.motiFee, disinfectionFee,
    },
    totalDutyGhs,
    totalDutyUsd: totalDutyGhs / exchangeRate,
  }
}

export function checkEligibility({ vehicleYear, origin, bodyType }) {
  const warnings = []
  const errors = []
  const currentYear = new Date().getFullYear()
  const age = currentYear - vehicleYear

  // Age check — Ghana Standards Authority GS 4510:2022
  if (age > 10) {
    errors.push(`This vehicle is ${age} years old. Ghana prohibits importation of vehicles over 10 years old.`)
  } else if (age > 8) {
    warnings.push(`This vehicle is ${age} years old — approaching Ghana's 10-year import age limit.`)
  }

  // RHD check — Act 891 explicit prohibition
  const rhdOrigins = ['Japan', 'UK', 'Australia', 'South Africa']
  if (rhdOrigins.includes(origin)) {
    warnings.push(`Vehicles from ${origin} are typically right-hand drive (RHD). RHD vehicles are prohibited for import into Ghana under Customs Act 2015 (Act 891) unless ministerially approved. Confirm your vehicle is left-hand drive before proceeding.`)
  }

  // Commercial vehicle / bus check — GSA homologation
  const busTypes = ['Bus', 'Minibus', 'School Bus', 'Coach']
  if (busTypes.some(t => bodyType?.toLowerCase().includes(t.toLowerCase()))) {
    warnings.push(`Buses and minibuses (M2/M3 category) require Ghana Standards Authority (GSA) homologation certification in addition to standard customs clearance. Consult a licensed clearing agent.`)
  }

  return { warnings, errors, eligible: errors.length === 0 }
}
