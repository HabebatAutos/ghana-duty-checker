'use client'

export default function ContactPage() {
  return (
    <main style={{ maxWidth: '850px', margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif' }}>
      
      {/* Page Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>
          Contact Us
        </h1>
        <p style={{ fontSize: '16px', color: '#4b5563', maxWidth: '550px', margin: '0 auto' }}>
          Have questions about your vehicle valuation or need help clearing your car at the port? Our support desk is here to assist you.
        </p>
      </div>

      {/* Verified Direct Support Box */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '36px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#166534', margin: 0 }}>
            DIRECT ASSISTANCE SUPPORT DESK
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: '#15803d', marginBottom: '24px' }}>
          Contact Administrator for port entry logistics, vehicle valuation, and clearing support.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          
          {/* Phone Call */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Direct Line (Ghana)
            </span>
            <a href="tel:+233206775587" style={{ fontSize: '16px', fontWeight: '700', color: '#111827', textDecoration: 'none' }}>
              +233 20 677 5587
            </a>
          </div>

          {/* WhatsApp */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              WhatsApp Desk
            </span>
            <a href="https://wa.me/447411545196" target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', fontWeight: '700', color: '#111827', textDecoration: 'none' }}>
              +44 7411 545196
            </a>
          </div>

          {/* Email */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Official Email
            </span>
            <a href="mailto:hasconsult71@gmail.com" style={{ fontSize: '15px', fontWeight: '700', color: '#111827', textDecoration: 'none', wordBreak: 'break-all' }}>
              hasconsult71@gmail.com
            </a>
          </div>

        </div>
      </div>

      {/* Services Provided Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px', marginBottom: '36px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
          Verified Port Entry Logistics Partners & Valuation Services
        </h3>
        <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginBottom: '12px' }}>
          Our administrator desk handles direct logistics support including:
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.8' }}>
          <li>Customs valuation guidance and document verification</li>
          <li>Linking importers with accredited clearing agents at Tema and Takoradi ports</li>
          <li>Logistics planning assessments and terminal simulation reports</li>
        </ul>
      </div>

      {/* Statutory Proviso Notice */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>
          Statutory Proviso Rule Clause
        </h4>
        <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
          Calculated parameters reflect appraisal methodologies locked down inside the Ghana Revenue Authority Customs Act 2015 (Act 891) runtime specifications. System metrics are deployed exclusively for vehicle logistics planning assessment and terminal entry sheet simulation. Realized execution figures remain tied directly to the live Bank of Ghana currency valuations active on transaction registration day.
        </p>
      </div>

    </main>
  )
}