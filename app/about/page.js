import Link from 'next/link'

export const metadata = {
  title: 'About CediDuty — Ghana Vehicle Import Duty Calculator',
  description: 'CediDuty helps importers get transparent, accurate vehicle customs duty estimates for Ghana using live exchange rates and GRA tariff rules.',
  alternates: {
    canonical: '/about',
  },
};

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

      {/* Registered Business Credentials */}
      <section style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
            Registered Business
          </h2>
          <p style={{ fontSize: '14px', color: '#15803d', margin: 0 }}>
            CediDuty is operated by <strong>CediDuty Technologies</strong>, registered with the Office of the Registrar of Companies, Republic of Ghana, under the Registration of Business Names Act, 1962 (Act 151).
          </p>
        </div>
        <div style={{ fontSize: '13px', color: '#166534', lineHeight: '1.8', whiteSpace: 'nowrap' }}>
          <div><strong>Reg. No.:</strong> BN092150826</div>
          <div><strong>TIN:</strong> P006771305X</div>
        </div>
      </section>

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

     {/* Team */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
          Team
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Agyeman Adom Ernest */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '420px',
            display: 'flex',
            gap: '18px',
            alignItems: 'flex-start'
          }}>
            <img
              src="/team/adom ernest.jpg"
              alt="Agyeman Adom Ernest"
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid #e5e7eb'
              }}
            />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                Agyeman Adom Ernest
              </h3>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#05643c', marginBottom: '14px' }}>
                Chief Executive Officer
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '2' }}>
                <li><strong>Education:</strong> BSc Software Engineering, Edinburgh Napier University (UK)</li>
                <li><strong>Background:</strong> Cybersecurity Expert</li>
                <li><strong>Location:</strong> Hertfordshire, England</li>
              </ul>
            </div>
          </div>

          {/* Gifty Kuadudze */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '420px',
            display: 'flex',
            gap: '18px',
            alignItems: 'flex-start'
          }}>
            <img
              src="/team/gifty kuadudze.jpg"
              alt="Gifty Kuadudze"
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid #e5e7eb'
              }}
            />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                Gifty Kuadudze
              </h3>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#05643c', marginBottom: '14px' }}>
                Manager
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '2' }}>
                <li><strong>Education:</strong> BSc Computer Science, University of Suffolk (UK)</li>
                <li><strong>Background:</strong> Website Developer</li>
                <li><strong>Location:</strong> Glasgow, Scotland</li>
              </ul>
            </div>
          </div>

          {/* Sampson Dorkenoo */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '420px',
            display: 'flex',
            gap: '18px',
            alignItems: 'flex-start'
          }}>
            <img
              src="/team/sampson-dorkenoo.jpg"
              alt="Sampson Dorkenoo"
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid #e5e7eb'
              }}
            />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                Sampson Dorkenoo
              </h3>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#05643c', marginBottom: '14px' }}>
                Marketing Director
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '2' }}>
                <li><strong>Education:</strong> BA Social Work &amp; Sociology, University of Ghana, Legon</li>
                <li><strong>Background:</strong> Coursework Consultant</li>
                <li><strong>Location:</strong> Accra, Ghana</li>
              </ul>
            </div>
          </div>

        </div>
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
