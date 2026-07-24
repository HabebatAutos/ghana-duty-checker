'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif', color: '#374151' }}>
      
      {/* Header Section */}
      <section style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '16px' }}>
          About CediDuty
        </h1>
        <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#4b5563' }}>
          Your reliable digital assistant for transparent vehicle valuation, customs duty calculations, and port entry clearing support in Ghana.
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

      {/* Our Purpose */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
          Our Purpose
        </h2>
        <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#4b5563', marginBottom: '16px' }}>
          Importing a car through Tema or Takoradi ports should be straightforward. Too often, car buyers, importers, and overseas shippers face unexpected clearance fees and confusing tax calculations when vehicles land at the harbor.
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#4b5563' }}>
          CediDuty was built to bridge this gap. By combining official customs tariff frameworks with real-time exchange rate updates, we give you clear financial clarity before committing money to purchase or ship a vehicle.
        </p>
      </section>

      {/* Verified Agent Leads & Support Desk */}
      <section style={{ 
        background: '#f9fafb', 
        border: '1px solid #e5e7eb', 
        borderRadius: '12px', 
        padding: '28px', 
        marginBottom: '40px' 
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
          Verified Inspection & Clearing Agent Leads
        </h2>
        <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#4b5563', marginBottom: '16px' }}>
          Calculating your taxes is only step one. Getting your vehicle safely inspected and cleared from port terminals requires trustworthy logistics partners.
        </p>
        <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0', fontSize: '15px', color: '#4b5563', lineHeight: '1.8' }}>
          <li><strong>Agent Matching:</strong> We link you directly with vetted, licensed port entry logistics partners and clearing agents.</li>
          <li><strong>Pre-Shipment & Terminal Inspection Support:</strong> Get assistance with vehicle condition checks, documentation, and valuation verification.</li>
          <li><strong>Direct Support Desk Access:</strong> Fast support for smooth terminal clearance and paperwork handling.</li>
        </ul>
      </section>

      {/* Why Choose CediDuty */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
          Why Importers Choose Us
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Accuracy & Transparency</h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Calculations reflect GRA Customs guidelines and current currency exchange rates.</p>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>No Hidden Surprises</h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Know all statutory levies and port handling fees before making a deposit.</p>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>End-to-End Assistance</h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>From valuation estimates to physical port clearance support through our partners.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div style={{ textAlign: 'center', paddingTop: '16px' }}>
        <Link href="/contact" style={{
          background: '#111827',
          color: '#ffffff',
          padding: '12px 28px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '14px',
          display: 'inline-block'
        }}>
          Get in Touch With Our Desk
        </Link>
      </div>

    </main>
  )
}