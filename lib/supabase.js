// lib/supabase.js
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Single source of truth for how emails are stored/looked-up in user_wallets.
export function normalizeEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') return null
  return rawEmail.trim().toLowerCase()
}

// Opaque, unguessable per-wallet secret. Stored client-side alongside the
// email and required (in addition to email) by any route that reads balance.
// This is what stops "I know your email" from being enough to read your wallet.
export function generateWalletSecret() {
  return randomUUID()
}