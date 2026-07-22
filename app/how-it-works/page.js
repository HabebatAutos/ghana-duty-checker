// app/how-it-works/page.js
import Link from 'next/link'

export const metadata = {
  title: 'How It Works — GhanaDuty',
  description: 'Learn how GhanaDuty calculates vehicle import taxes in Ghana using real-time manufacturer prices, Bank of Ghana exchange rates, and Ghana Customs guidelines.',
};

export default function HowItWorks() {
  return (
    <>
      <div className="hero" style={{ padding: '40px 24px 48px' }}>
        <h1 style={{ fontSize: 32 }}>How GhanaDuty Works</h1>
        <p>Get clear, accurate estimates of your vehicle clearing cost before your car arrives at Tema or Takoradi port.</p>
      </div>

      <div className="container">
        <div className="page-content">
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--green)', marginBottom: 12 }}>
                Why Other Calculators Give Wrong Figures
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
                Most online calculators rely on static lists of cars previously cleared at the port. If a specific car model, trim, or year is missing from their list, the calculator gives an error or shows inaccurate estimates.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                GhanaDuty works differently: we find the original price of the car when it was brand new, convert it using the current official Bank of Ghana exchange rate, and apply the exact Ghana Revenue Authority (GRA) tax formula. This gives you a accurate calculation for any car model, make, or year.
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--green)', marginBottom: 16 }}>
                The 5-Step Calculation Breakdown
              </h2>
              {[
                { 
                  n: '1', 
                  title: 'Select Your Vehicle', 
                  body: "Enter your 17-digit Chassis Number (VIN) to automatically load details for US vehicles, or manually pick the car make, model, year, and engine size." 
                },
                { 
                  n: '2', 
                  title: 'Original Factory Price Lookup', 
                  body: 'Our system looks up what the vehicle cost brand new in its country of origin (USA, Europe, Asia). This original manufacturer price is the official starting point required by Ghana Customs.' 
                },
                { 
                  n: '3', 
                  title: 'Age Discount (Depreciation)', 
                  body: 'Ghana Customs grants a discount on the car value based on how old it is: 0% discount for brand new cars (0–2 years), 30% discount for cars 3–4 years old, and 50% discount for cars 5 years or older.' 
                },
                { 
                  n: '4', 
                  title: 'Port Arrival Value (CIF)', 
                  body: 'Estimated shipping freight and transit insurance are added to the discounted car value. This total gives the CIF (Cost, Insurance, and Freight) value in Ghana Cedis.' 
                },
                { 
                  n: '5', 
                  title: 'Complete Tax & Duty Breakdown', 
                  body: 'All official Ghana Customs taxes and fees are added to the CIF value—including Import Duty, Import VAT, NHIL, GETFund, ECOWAS Levy, Exam Fees, and Network Charges—giving you the full total needed for clearance.' 
                },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {step.n}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{step.title}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--green)', marginBottom: 12 }}>
                Understanding Exchange Rates
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                By law under the Customs Act 2015 (Act 891), Ghana Customs calculates all taxes using the official Bank of Ghana exchange rate on the exact day your declaration is processed at the harbor. GhanaDuty uses live Bank of Ghana rates so your estimates match real port charges as closely as possible.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--green)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontFamily: "'DM Serif Display', serif", fontSize: 16 }}>
              Calculate Your Duty Now
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 GhanaDuty • Official Ghana Customs Act 2015 (Act 891) Calculations</p>
      </footer>
    </>
  );
}