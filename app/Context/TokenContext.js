'use client' // app/Context/TokenContext.js

import { createContext, useContext, useState, useEffect } from 'react'

const TokenContext = createContext(null)

export function TokenProvider({ children }) {
  const [tokens, setTokens] = useState(0)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [hasUsedFreePremium, setHasUsedFreePremium] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Sync state with local disk storage on initial mount
  useEffect(() => {
    const storedTokens = localStorage.getItem('gd_tokens')
    const storedSub = localStorage.getItem('gd_is_unlimited')
    const storedFreePremium = localStorage.getItem('gd_free_premium_used')
    const storedEmail = localStorage.getItem('gd_user_email')

    if (storedTokens !== null) setTokens(parseInt(storedTokens, 10))
    if (storedSub === 'true') setIsUnlimited(true)
    if (storedFreePremium === 'true') setHasUsedFreePremium(true)
    if (storedEmail) setUserEmail(storedEmail)
  }, [])

  const spendToken = () => {
    if (isUnlimited) return true
    
    // GOLDEN TICKET: First time free lookup pass
    if (!hasUsedFreePremium) {
      setHasUsedFreePremium(true)
      localStorage.setItem('gd_free_premium_used', 'true')
      return true
    }

    // Subsequent lookups deduct 1 credit from purchased balance
    if (tokens > 0) {
      const newBalance = tokens - 1
      setTokens(newBalance)
      localStorage.setItem('gd_tokens', String(newBalance))
      return true
    }
    return false
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

    // 1. Save and remember email identity
    if (verificationData.email) {
      setUserEmail(verificationData.email)
      localStorage.setItem('gd_user_email', verificationData.email)
    }

    // 2. Set absolute token count returned by Supabase
    if (typeof verificationData.tokens === 'number') {
      setTokens(verificationData.tokens)
      localStorage.setItem('gd_tokens', String(verificationData.tokens))
    }

    // 3. Update subscription status
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