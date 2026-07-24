'use client'

import { useState } from 'react'

const PRESET_AMOUNTS = [10, 20, 50]

export default function DonateModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [thankYou, setThankYou] = useState(false)

  if (!isOpen) return null

  const handleDonate = (amount) => {
    setModalError('')

    if (!email || !email.includes('@')) {
      setModalError('Please provide a valid email address for your donation receipt.')
      return
    }
    if (!amount || amount < 1) {
      setModalError('Please enter a valid donation amount.')
      return
    }
    if (typeof window === 'undefined' || !window.PaystackPop) {
      setModalError('Paystack payment gateway is loading. Please refresh and try again.')
      return
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!paystackKey) {
      setModalError('Paystack public key is missing.')
      return
    }

    setLoading(true)

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: email.trim(),
      amount: Math.round(amount * 100), // GHS -> pesewas
      currency: 'GHS',
      ref: 'GHDUTY_DONATE_' + Math.floor(Math.random() * 1000000000 + 1),
      callback: function (response) {
        setLoading(false)
        fetch('/api/verify-donation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: response.reference,
            email: email.trim(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setThankYou(true)
            } else {
              setModalError(data.error || data.message || 'Payment verification failed.')
            }
          })
          .catch(() => {
            setModalError('Network error verifying payment.')
          })
      },
      onClose: function () {
        setLoading(false)
      },
    })

    handler.openIframe()
  }

  const handleClose = () => {
    setThankYou(false)
    setModalError('')
    setCustomAmount('')
    onClose()
  }

  return (
    <div className="modal-overlay-blur">
      <div className="modal-inner-surface" style={{ maxWidth: '440px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            ❤️ Support CEDIDUTY
          </h3>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {thankYou ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🙏</div>
            <p style={{ fontSize: '14px', color: '#166534', fontWeight: '700', margin: 0 }}>
              Thank you for your support!
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Your donation helps keep CEDIDUTY free and running.
            </p>
            <button
              onClick={handleClose}
              style={{ marginTop: '18px', background: '#05643c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px', lineHeight: '1.4' }}>
              CEDIDUTY is free to use. If it saved you time or money, consider
              chipping in toward hosting and maintenance costs.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Your Email Address *
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

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleDonate(amt)}
                  disabled={loading}
                  style={{
                    flex: '1 1 80px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                    color: '#166534', padding: '12px', borderRadius: '8px', fontWeight: '700',
                    fontSize: '13px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1
                  }}
                >
                  GHC {amt}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                min="1"
                placeholder="Custom amount (GHC)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="premium-input-field"
                style={{ flex: 1, padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <button
                onClick={() => handleDonate(parseFloat(customAmount))}
                disabled={loading || !customAmount}
                style={{
                  background: '#05643c', color: '#ffffff', border: 'none', padding: '10px 16px',
                  borderRadius: '8px', fontWeight: '700', cursor: (loading || !customAmount) ? 'default' : 'pointer',
                  fontSize: '13px', opacity: (loading || !customAmount) ? 0.6 : 1, whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'Loading...' : 'Donate'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}