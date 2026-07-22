'use client'

import { useState } from 'react'
import { useTokens } from '../Context/TokenContext'

export default function PricingModal({ isOpen, onClose }) {
  const { applyPaymentResult } = useTokens()
  const [email, setEmail] = useState('')
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [modalError, setModalError] = useState('')

  if (!isOpen) return null

  const handlePurchase = (amount, planType) => {
    setModalError('')

    // 1. Validate email
    if (!email || !email.includes('@')) {
      setModalError('Please provide a valid email address to proceed with Paystack payment.')
      return
    }

    // 2. Check if Paystack script is loaded
    if (typeof window === 'undefined' || !window.PaystackPop) {
      setModalError('Paystack payment gateway is loading. Please refresh and try again.')
      return
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

    if (!paystackKey) {
      setModalError('Paystack public key is missing. Please set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in your .env.local file.')
      return
    }

    setLoadingPlan(planType)

    // 3. Initialize Paystack Popup
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: email.trim(),
      amount: amount * 100, // Convert GHS to Pesewas
      currency: 'GHS',
      ref: 'GHDUTY_' + Math.floor(Math.random() * 1000000000 + 1),
      callback: function (response) {
        setLoadingPlan(null)
        // Verify transaction with backend (sending reference, email, and planType)
        fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: response.reference,
            email: email.trim(),
            planType: planType,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              applyPaymentResult(data)
              alert('Payment successful! Your credits have been updated.')
              onClose()
            } else {
              setModalError(data.error || data.message || 'Payment verification failed.')
            }
          })
          .catch(() => {
            setModalError('Network error verifying payment.')
          })
      },
      onClose: function () {
        setLoadingPlan(null)
      },
    })

    handler.openIframe()
  }

  return (
    <div className="modal-overlay-blur">
      <div className="modal-inner-surface" style={{ maxWidth: '500px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            Choose Token Package
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {/* EMAIL INPUT FIELD */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            Receipt Email Address *
          </label>
          <input
            type="email"
            placeholder="e.g. kwame@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="premium-input-field"
            style={{ width: '100%', padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        {modalError && (
          <div style={{ padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '12px', marginBottom: '16px' }}>
            ⚠️ {modalError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* TIER 1: GHC 20 */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>🪙 Enthusiast Pack</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>10 VIN Lookups (GHC 2 / lookup)</p>
            </div>
            <button
              onClick={() => handlePurchase(20, 'tokens')}
              disabled={loadingPlan === 'tokens'}
              style={{ background: '#05643c', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
            >
              {loadingPlan === 'tokens' ? 'Loading...' : 'GHC 20'}
            </button>
          </div>

          {/* TIER 2: GHC 100 */}
          <div style={{ border: '2px solid #05643c', background: '#f0fdf4', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '10px', background: '#05643c', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>POPULAR</span>
              <h4 style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>💼 Agent Pro Pass</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#166534' }}>Unlimited VIN Lookups for 30 Days</p>
            </div>
            <button
              onClick={() => handlePurchase(100, 'subscription')}
              disabled={loadingPlan === 'subscription'}
              style={{ background: '#05643c', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
            >
              {loadingPlan === 'subscription' ? 'Loading...' : 'GHC 100'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}