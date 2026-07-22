// lib/formatters.js

export function fmtGhs(amount) {
  if (!amount && amount !== 0) return '—'
  return 'GH₵ ' + parseFloat(amount).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function fmtUsd(amount) {
  if (!amount && amount !== 0) return '—'
  return '$' + parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function fmtUsdDecimal(amount) {
  if (!amount && amount !== 0) return '—'
  return '$' + parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function fmtPct(rate) {
  return (rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 2) + '%'
}
