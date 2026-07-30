'use client'

import { useState } from 'react'
import { useTokens } from '../Context/TokenContext'

export default function PricingModal({ isOpen, onClose }) {
  const { applyPaymentResult } = useTokens()
  const [email, setEmail] = useState('')
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [modalError, setModalError] = useState('')

  // --- Restore access flow ---
  const [showRestore, setShowRestore] = useState(false)
  const [restoreStep, setRestoreStep] = useState('email') // 'email' | 'code'
  const [restoreEmail, setRestoreEmail] = useState('')
  const [restoreCode, setRestoreCode] = useState('')
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('')

  if (!isOpen) return null

  const resetRestoreState = () => {
    setShowRestore(false)
    setRestoreStep('email')
    setRestoreEmail('')
    setRestoreCode('')
    setRestoreError('')
    setRestoreSuccessMsg('')
  }

  const handleRequestCode = async () => {
    setRestoreError('')
    if (!restoreEmail || !restoreEmail.includes('@')) {
      setRestoreError('Please enter a valid email address.')
      return
    }

    setRestoreLoading(true)
    try {
      const res = await fetch('/api/request-restore-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: restoreEmail.trim() }),
      })
      const data = await res.json()

      if (!data.success) {
        setRestoreError(data.error || 'Could not send verification code.')
        setRestoreLoading(false)
        return
      }

      setRestoreStep('code')
      setRestoreLoading(false)
    } catch {
      setRestoreError('Network error. Please try again.')
      setRestoreLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setRestoreError('')
    if (!restoreCode || restoreCode.trim().length !== 6) {
      setRestoreError('Please enter the 6-digit code from your email.')
      return
    }

    setRestoreLoading(true)
    try {
      const res = await fetch('/api/verify-restore-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: restoreEmail.trim(), code: restoreCode.trim() }),
      })
      const data = await res.json()

      if (!data.success) {
        setRestoreError(data.error || 'Verification failed.')
        setRestoreLoading(false)
        return
      }

      // Load the restored wallet into this device's state + localStorage.
      applyPaymentResult(data)
      setRestoreLoading(false)

      if (data.isPro || data.tokens > 0) {
        setRestoreSuccessMsg(
          data.isPro
            ? 'Account restored! Your unlimited access is now active on this device.'
            : `Account restored! You have ${data.tokens} token(s) available.`
        )
        setTimeout(() => {
          resetRestoreState()
          onClose()
        }, 2000)
      } else {
        // Depleted balance — drop them back into the purchase view.
        setRestoreSuccessMsg('')
        resetRestoreState()
        setModalError('Your token balance is empty. Choose a package below to continue.')
      }
    } catch {
      setRestoreError('Network error. Please try again.')
      setRestoreLoading(false)
    }
  }

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

        {/* RESTORE ACCESS TOGGLE */}
        {!showRestore && (
          <button
            onClick={() => { setShowRestore(true); setModalError(''); }}
            style={{
              background: 'none', border: 'none', color: '#05643c', fontSize: '12px',
              fontWeight: '700', cursor: 'pointer', textDecoration: 'underline',
              padding: 0, marginBottom: '18px', display: 'block'
            }}
          >
            Already purchased? Restore access on this device
          </button>
        )}

        {/* RESTORE ACCESS PANEL */}
        {showRestore && (
          <div style={{
            border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '10px',
            padding: '16px', marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#166534' }}>
                🔑 Restore Access
              </h4>
              <button
                onClick={resetRestoreState}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>

            {restoreSuccessMsg ? (
              <p style={{ fontSize: '13px', color: '#166534', fontWeight: '700', margin: 0 }}>
                ✅ {restoreSuccessMsg}
              </p>
            ) : restoreStep === 'email' ? (
              <>
                <p style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
                  Enter the email you used to purchase. We'll send a verification code.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    placeholder="e.g. kwame@example.com"
                    value={restoreEmail}
                    onChange={(e) => setRestoreEmail(e.target.value)}
                    className="premium-input-field"
                    style={{ flex: 1, padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={handleRequestCode}
                    disabled={restoreLoading}
                    style={{
                      background: '#05643c', color: '#fff', border: 'none', padding: '10px 14px',
                      borderRadius: '8px', fontWeight: '700', fontSize: '12px',
                      cursor: restoreLoading ? 'default' : 'pointer', opacity: restoreLoading ? 0.6 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {restoreLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
                  Enter the 6-digit code sent to <strong>{restoreEmail}</strong>.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={restoreCode}
                    onChange={(e) => setRestoreCode(e.target.value.replace(/\D/g, ''))}
                    className="premium-input-field"
                    style={{ flex: 1, padding: '10px 12px', fontSize: '15px', letterSpacing: '4px', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={restoreLoading}
                    style={{
                      background: '#05643c', color: '#fff', border: 'none', padding: '10px 14px',
                      borderRadius: '8px', fontWeight: '700', fontSize: '12px',
                      cursor: restoreLoading ? 'default' : 'pointer', opacity: restoreLoading ? 0.6 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {restoreLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <button
                  onClick={() => { setRestoreStep('email'); setRestoreCode(''); setRestoreError(''); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', marginTop: '8px', padding: 0 }}
                >
                  Use a different email
                </button>
              </>
            )}

            {restoreError && (
              <div style={{ marginTop: '10px', padding: '8px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '11px' }}>
                ⚠️ {restoreError}
              </div>
            )}
          </div>
        )}

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