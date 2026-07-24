'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTokens } from '../Context/TokenContext'

// TODO: replace with your real donation link (Buy Me a Coffee, Paystack
// donate page, etc.)
const DONATE_URL = 'https://buymeacoffee.com/yourpage'

export default function Navbar() {
  const { tokens, isUnlimited } = useTokens()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <style>{`
        .navbar-desktop-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .navbar-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 22px;
          color: #111827;
          padding: 4px;
        }
        .mobile-dropdown-menu {
          display: none;
        }
        .donate-navbar-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 9999px;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s ease;
        }
        .donate-navbar-btn:hover {
          background: #fde68a;
        }

        @media (max-width: 860px) {
          .navbar-desktop-links {
            display: none !important;
          }
          .navbar-hamburger {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .mobile-dropdown-menu.open {
            display: flex !important;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          }
        }
      `}</style>

      <nav className="navbar" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', background: '#ffffff', borderBottom: '1px solid #e5e7eb',
        position: 'sticky', top: 0, zIndex: 100, width: '100%', boxSizing: 'border-box'
      }}>
        {/* LOGO & BRAND */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image 
            src="/logo.png" 
            alt="CEDIDUTY Official Navigation Logo" 
            width={48} 
            height={48}
            priority
            style={{ 
              objectFit: 'contain',
              imageRendering: '-webkit-optimize-contrast'
            }} 
          />
          <span className="navbar-name" style={{ color: '#111827', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.02em' }}>
            CEDIDUTY
          </span>
        </Link>

        {/* RIGHT SIDE: TOKENS + DONATE + DESKTOP LINKS + HAMBURGER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Dynamic Badge Display Matrix */}
          <div className="token-status-badge" style={{ display: 'flex', alignItems: 'center' }}>
            {isUnlimited ? (
              <span style={{
                background: '#e0f2fe', color: '#0369a1', fontSize: '11px',
                fontWeight: '600', padding: '5px 10px', borderRadius: '9999px', border: '1px solid #bae6fd', whiteSpace: 'nowrap'
              }}>
                💼 Pro (Unlimited)
              </span>
            ) : tokens > 0 ? (
              <span style={{
                background: '#ecfdf5', color: '#047857', fontSize: '11px',
                fontWeight: '600', padding: '5px 10px', borderRadius: '9999px', border: '1px solid #a7f3d0', whiteSpace: 'nowrap'
              }}>
                🪙 {tokens} Tokens
              </span>
            ) : (
              <span style={{
                background: '#f3f4f6', color: '#4b5563', fontSize: '11px',
                fontWeight: '500', padding: '5px 10px', borderRadius: '9999px', whiteSpace: 'nowrap'
              }}>
                ⚡ Casual (0)
              </span>
            )}
          </div>

          {/* Standalone Donate CTA — sits right next to the token badge */}
          
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="donate-navbar-btn"
          >
            ❤️ Donate
          </a>

          {/* Desktop Navigation Links */}
          <div className="navbar-desktop-links">
            <Link href="/how-it-works" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>
              How It Works
            </Link>
            <Link href="/about" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>
              About Us
            </Link>
            <Link href="/contact" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>
              Contact Us
            </Link>
            <Link href="/faq" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>
              FAQ
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="navbar-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu Drawer */}
      <div className={`mobile-dropdown-menu ${mobileMenuOpen ? 'open' : ''}`}>
        
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileMenuOpen(false)}
          style={{ textDecoration: 'none', color: '#92400e', fontSize: '14px', fontWeight: '700', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}
        >
          ❤️ Donate
        </a>
        <Link 
          href="/how-it-works" 
          onClick={() => setMobileMenuOpen(false)}
          style={{ textDecoration: 'none', color: '#334155', fontSize: '14px', fontWeight: '600', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}
        >
          How It Works
        </Link>
        <Link 
          href="/about" 
          onClick={() => setMobileMenuOpen(false)}
          style={{ textDecoration: 'none', color: '#334155', fontSize: '14px', fontWeight: '600', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}
        >
          About Us
        </Link>
        <Link 
          href="/contact" 
          onClick={() => setMobileMenuOpen(false)}
          style={{ textDecoration: 'none', color: '#334155', fontSize: '14px', fontWeight: '600', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}
        >
          Contact Us
        </Link>
        <Link 
          href="/faq" 
          onClick={() => setMobileMenuOpen(false)}
          style={{ textDecoration: 'none', color: '#334155', fontSize: '14px', fontWeight: '600', padding: '6px 0' }}
        >
          FAQ
        </Link>
      </div>
    </>
  )
}