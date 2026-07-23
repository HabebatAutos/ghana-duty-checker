'use client' // app/Context/TokenContext.js
import { createContext, useContext, useState, useEffect } from 'react'

const TokenContext = createContext(null)

export function TokenProvider({ children }) {
  const [tokens, setTokens] = useState(0)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [hasUsedFreePremium, setHasUsedFreePremium] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [walletSecret, setWalletSecret] = useState('')

  // Sync state with local disk storage on initial mount, then reconcile
  // with the server as the source of truth (local values can go stale
  // or drift — server is authoritative).
  useEffect(() => {
    const storedTokens = localStorage.getItem('gd_tokens')
    const storedSub = localStorage.getItem('gd_is_unlimited')
    const storedFreePremium = localStorage.getItem('gd_free_premium_used')
    const storedEmail = localStorage.getItem('gd_user_email')
    const storedSecret = localStorage.getItem('gd_wallet_secret')

    if (storedTokens !== null) setTokens(parseInt(storedTokens, 10))
    if (storedSub === 'true') setIsUnlimited(true)
    if (storedFreePremium === 'true') setHasUsedFreePremium(true)
    if (storedEmail) setUserEmail(storedEmail)
    if (storedSecret) setWalletSecret(storedSecret)

    // If we have both an email and a secret, confirm the real balance
    // with the server rather than trusting local values indefinitely.
    if (storedEmail && storedSecret) {
      fetch('/api/restore-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: storedEmail, secret: storedSecret }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTokens(data.tokens)
            setIsUnlimited(data.isPro)
            localStorage.setItem('gd_tokens', String(data.tokens))
            localStorage.setItem('gd_is_unlimited', String(data.isPro))
          } else {
            // Secret didn't match what's on record (e.g. DB was reset,
            // or this local data is stale/tampered) — clear it so we
            // don't keep showing a balance that isn't real.
            localStorage.removeItem('gd_user_email')
            localStorage.removeItem('gd_wallet_secret')
            setUserEmail('')
            setWalletSecret('')
          }
        })
        .catch((err) => {
          // Network hiccup — keep showing local values rather than
          // wiping the user's visible balance over a transient failure.
          console.error('[TokenContext] restore-account sync failed:', err)
        })
    }
  }, [])

  // Now async and server-backed. Previously this only decremented
  // localStorage/React state, which meant the DB balance never moved
  // and the next purchase would add on top of a stale, never-spent
  // total (10 -> 20 -> 30 bug). Every spend must now be confirmed by
  // the server against the real wallet row.
  const spendToken = async () => {
    if (isUnlimited) return true

    if (!hasUsedFreePremium) {
      setHasUsedFreePremium(true)
      localStorage.setItem('gd_free_premium_used', 'true')
      return true
    }

    if (!userEmail || !walletSecret) {
      // No paid wallet identified on this device — nothing to spend.
      return false
    }

    try {
      const res = await fetch('/api/spend-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, secret: walletSecret }),
      })
      const data = await res.json()

      if (!data.success) {
        return false
      }

      setTokens(data.tokens)
      setIsUnlimited(data.isPro)
      localStorage.setItem('gd_tokens', String(data.tokens))
      return true
    } catch (err) {
      console.error('[TokenContext] spendToken failed:', err)
      return false
    }
  }

  const addTokens = (amount) => {
    const newBalance = tokens + amount
    setTokens(newBalance)
    localStorage.setItem('gd_tokens', String(newBalance))
  }

  const activateSubscription = () => {
    setIsUnlimited(true)
    localStorage.setItem('gd_is_unlimited', 'true')
  }

  // Helper method called directly after Paystack verification
  const applyPaymentResult = (verificationData) => {
    if (!verificationData || !verificationData.success) return

    if (verificationData.email) {
      setUserEmail(verificationData.email)
      localStorage.setItem('gd_user_email', verificationData.email)
    }

    // Store the wallet secret returned by verify-payment. This is what
    // proves ownership on future visits — without it, restore-account
    // and spend-token won't recognize this wallet.
    if (verificationData.walletSecret) {
      setWalletSecret(verificationData.walletSecret)
      localStorage.setItem('gd_wallet_secret', verificationData.walletSecret)
    }

    if (typeof verificationData.tokens === 'number') {
      setTokens(verificationData.tokens)
      localStorage.setItem('gd_tokens', String(verificationData.tokens))
    }

    if (typeof verificationData.isPro === 'boolean') {
      setIsUnlimited(verificationData.isPro)
      localStorage.setItem('gd_is_unlimited', String(verificationData.isPro))
    }
  }

  return (
    <TokenContext.Provider value={{
      tokens,
      isUnlimited,
      hasUsedFreePremium,
      userEmail,
      walletSecret,
      spendToken,
      addTokens,
      activateSubscription,
      applyPaymentResult
    }}>
      {children}
    </TokenContext.Provider>
  )
}

export const useTokens = () => useContext(TokenContext)