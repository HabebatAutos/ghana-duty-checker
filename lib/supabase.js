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

// ---------------------------------------------------------------------------
// Dynamic MSRP lineup cache (replaces the old local-disk data/dynamic_cache.json,
// which only worked on a persistent filesystem and silently failed on Vercel's
// read-only, ephemeral serverless containers). Backed by the dynamic_msrp_cache
// table — see the SQL below. Uses supabaseAdmin since this is server-only,
// has no per-user ownership, and should bypass RLS entirely.
//
//   create table if not exists dynamic_msrp_cache (
//     cache_key text primary key,
//     lineup jsonb not null,
//     cached_at timestamptz not null default now()
//   );
//
export async function readDynamicCache(key) {
  try {
    const { data, error } = await supabaseAdmin
      .from('dynamic_msrp_cache')
      .select('lineup')
      .eq('cache_key', key)
      .maybeSingle()
    if (error) throw error
    return data?.lineup || null
  } catch (err) {
    console.error('[SUPABASE CACHE READ ERROR]', err.message)
    return null
  }
}

export async function writeToDynamicCache(key, catalogData) {
  try {
    const { error } = await supabaseAdmin
      .from('dynamic_msrp_cache')
      .upsert({ cache_key: key, lineup: catalogData, cached_at: new Date().toISOString() })
    if (error) throw error
  } catch (err) {
    console.error('[SUPABASE CACHE WRITE ERROR]', err.message)
  }
}