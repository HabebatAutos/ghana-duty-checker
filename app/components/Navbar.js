'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTokens } from '../Context/TokenContext'
import DonateModal from './DonateModal'

export default function Navbar() {
  const { tokens, isUnlimited } = useTokens()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [donateModalOpen, setDonateModalOpen] = useState(false)

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
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }
        .donate-navbar-btn:hover {
          background: #fde68a;
        }
        .navbar-logo-img {
          width: 48px;
          height: 48px;
        }
        .navbar-name {
          font-size: 18px;
        }
        .token-status-badge span {
          font-size: 11px;
          padding: 5px 10px;
        }

        /* Tighten everything progressively as space shrinks, instead of
           keeping full-size elements and letting them collide. */
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

        @media (max-width: 480px) {
          .navbar {
            padding: 10px 12px !important;
          }
          .navbar-logo-img {
            width: 34px !important;
            height: 34px !important;
          }
          .navbar-name {
            font-size: 14px !important;
            letter-spacing: -0.01em !important;
          }
          .navbar-right-group {
            gap: 8px !important;
          }
          .token-status-badge span {
            font-size: 10px !important;
            padding: 4px 8px !important;
          }
          .donate-navbar-btn {
            font-size: 10px !important;
            padding: 4px 9px !important;
            gap: 3px !important;
          }
          .navbar-hamburger {
            font-size: 19px !important;
            padding: 2px !important;
          }
        }

        @media (max-width: 360px) {
          /* Extremely narrow screens: drop the "Tokens"/"Casual" wording,
             keep just the number, so the badge doesn't force a wrap. */
          .token-status-badge .badge-full-label {
            display: none;
          }
          .token-status-badge .badge-short-label {
            display: inline;
          }
        }
        .badge-short-label {
          display: none;
        }
      `}</style>

      <nav className="navbar" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', background: '#ffffff', borderBottom: '1px solid #e5e7eb',
        position: 'sticky', top: 0, zIndex: 100, width: '100%', boxSizing: 'border-box'
      }}>
        {/* LOGO & BRAND */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Image 
            src="/logo.png" 
            alt="CEDIDUTY Official Navigation Logo" 
            width={48} 
            height={48}
            priority
            className="navbar-logo-img"
            style={{ 
              objectFit: 'contain',
              imageRendering: '-webkit-optimize-contrast',
              flexShrink: 0
            }} 
          />
          <span className="navbar-name" style={{ color: '#111827', fontWeight: '800', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            CEDIDUTY
          </span>
        </Link>

        {/* RIGHT SIDE: TOKENS + DONATE + DESKTOP LINKS + HAMBURGER */}
        <div className="navbar-right-group" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          {/* Dynamic Badge Display Matrix */}
          <div className="token-status-badge" style={{ display: 'flex', alignItems: 'center' }}>
            {isUnlimited ? (
              <span style={{
                background: '#e0f2fe', color: '#0369a1',
                fontWeight: '600', borderRadius: '9999px', border: '1px solid #bae6fd', whiteSpace: 'nowrap'
              }}>
                <span className="badge-full-label">💼 Pro (Unlimited)</span>
                <span className="badge-short-label">💼 Pro</span>
              </span>
            ) : tokens > 0 ? (
              <span style={{
                background: '#ecfdf5', color: '#047857',
                fontWeight: '600', borderRadius: '9999px', border: '1px solid #a7f3d0', whiteSpace: 'nowrap'
              }}>
                <span className="badge-full-label">🪙 {tokens} Tokens</span>
                <span className="badge-short-label">🪙 {tokens}</span>
              </span>
            ) : (
              <span style={{
                background: '#f3f4f6', color: '#4b5563',
                fontWeight: '500', borderRadius: '9999px', whiteSpace: 'nowrap'
              }}>
                <span className="badge-full-label">⚡ Casual (0)</span>
                <span className="badge-short-label">⚡ 0</span>
              </span>
            )}
          </div>

          {/* Standalone Donate CTA — opens the in-site Paystack donate modal */}
          <button
            onClick={() => setDonateModalOpen(true)}
            className="donate-navbar-btn"
          >
            ❤️ Donate
          </button>

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
        <button
          onClick={() => { setMobileMenuOpen(false); setDonateModalOpen(true) }}
          style={{ background: 'none', border: 'none', textAlign: 'left', textDecoration: 'none', color: '#92400e', fontSize: '14px', fontWeight: '700', padding: '6px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
        >
          ❤️ Donate
        </button>
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

      <DonateModal isOpen={donateModalOpen} onClose={() => setDonateModalOpen(false)} />
    </>
  )
}