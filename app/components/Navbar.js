'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTokens } from '../Context/TokenContext'

export default function Navbar() {
  const { tokens, isUnlimited } = useTokens()

  return (
    <nav className="navbar" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 32px', background: '#ffffff', borderBottom: '1px solid #e5e7eb'
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Image 
          src="/logo.png" 
          alt="GhanaDuty Official Navigation Logo" 
          width={42} 
          height={42}
          priority
          style={{ 
            objectFit: 'contain',
            imageRendering: '-webkit-optimize-contrast'
          }} 
        />
        <span className="navbar-name" style={{ color: '#111827', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.02em' }}>
          GhanaDuty
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Dynamic Badge Display Matrix */}
        <div className="token-status-badge" style={{ display: 'flex', alignItems: 'center' }}>
          {isUnlimited ? (
            <span style={{
              background: '#e0f2fe', color: '#0369a1', fontSize: '12px',
              fontWeight: '600', padding: '6px 12px', borderRadius: '9999px', border: '1px solid #bae6fd'
            }}>
              💼 Agent Pro (Unlimited)
            </span>
          ) : tokens > 0 ? (
            <span style={{
              background: '#ecfdf5', color: '#047857', fontSize: '12px',
              fontWeight: '600', padding: '6px 12px', borderRadius: '9999px', border: '1px solid #a7f3d0'
            }}>
              🪙 {tokens} Tokens Left
            </span>
          ) : (
            <span style={{
              background: '#f3f4f6', color: '#4b5563', fontSize: '12px',
              fontWeight: '500', padding: '6px 12px', borderRadius: '9999px'
            }}>
              ⚡ Casual Account (0 Tokens)
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <div className="navbar-links" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/how-it-works" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>
            How It Works
          </Link>
          <Link href="/about" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>
            About Us
          </Link>
          <Link href="/contact" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>
            Contact Us
          </Link>
          <Link href="/faq" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>
            FAQ
          </Link>
        </div>
      </div>
    </nav>
  )
}