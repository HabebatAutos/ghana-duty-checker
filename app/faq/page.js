// app/faq/page.js
import Link from 'next/link'

export const metadata = {
  title: 'FAQ — CediDuty Ghana Vehicle Import Duty Calculator',
  description: 'Frequently asked questions about Ghana vehicle import duty, customs calculations, depreciation rules, and using the CediDuty calculator.',
};

const faqs = [
  {
    q: 'Why does Ghana Customs use the MSRP instead of my auction purchase price?',
    a: "Ghana Customs does not accept the buyer's purchase price as the customs value. Instead, they use the vehicle's original manufacturer suggested retail price (MSRP) and apply a depreciation formula based on the vehicle's age. This prevents undervaluation and ensures consistent duty collection. This is the methodology prescribed under Customs Act 2015 (Act 891).",
  },
  {
    q: 'What exchange rate will Ghana Customs use for my vehicle?',
    a: "Per Customs Act 2015 (Act 891), the Bank of Ghana prevailing exchange rate at the time the vehicle is entered for delivery — meaning the date you file your customs declaration at Tema Port — will be used. This is not the rate on the day you purchased the vehicle or shipped it. If your vehicle is still in transit, the rate at clearance may differ from today's rate.",
  },
  {
    q: 'What is the depreciation rule for used vehicles?',
    a: "Ghana Customs applies depreciation to the MSRP as follows: vehicles 0-2 years old: 0% depreciation. Vehicles 3-4 years old: 30% depreciation. Vehicles 5 years and older: 50% depreciation. The vehicle's age is calculated as the current year minus the model year.",
  },
  {
    q: 'Can I import a right-hand drive vehicle into Ghana?',
    a: 'No. The importation of right-hand drive (RHD) vehicles is explicitly prohibited under Customs Act 2015 (Act 891) unless approved by the Minister. Vehicles from Japan, the UK, and some other markets are typically RHD — always confirm your vehicle is left-hand drive before purchasing. A prohibited vehicle can be seized and forfeited to the State.',
  },
  {
    q: 'Is there an age limit on vehicles I can import?',
    a: 'Yes. Under Ghana Standards Authority regulations (GS 4510:2022), vehicles over 10 years old from the manufacturing year are prohibited from import. For example, in 2026 you cannot import a vehicle manufactured before 2016. CediDuty will warn you if you attempt to calculate duty on an overage vehicle.',
  },
  {
    q: 'What is CIF and why does it matter?',
    a: 'CIF stands for Cost, Insurance, and Freight. It is the total value of your vehicle delivered to Tema Port — the depreciated vehicle value plus your estimated freight cost plus insurance (typically about 1% of the vehicle value). All Ghana Customs duties are calculated as a percentage of the CIF value converted to Ghana Cedis.',
  },
  {
    q: 'Can a returning Ghanaian import a vehicle duty-free as a removal article?',
    a: 'No. While removal articles (personal effects of returning Ghanaians who lived abroad for 12+ months) are duty-exempt under Act 891, motor vehicles are explicitly excluded from this exemption. All vehicles are subject to full import duty regardless of the owner\'s residency status.',
  },
  {
    q: 'What happens if I do not clear my vehicle within 60 days?',
    a: 'Under Customs Act 2015 (Act 891), a vehicle not entered and cleared within 60 days of final discharge at port is forfeited to the State. Ghana Revenue Authority will dispose of the forfeited vehicle by auction or allocation. Always ensure your clearing agent files the declaration promptly upon arrival.',
  },
  {
    q: 'Are the figures from GhanaDuty official?',
    a: 'No. GhanaDuty provides estimates for planning purposes computed using the methodology prescribed under Customs Act 2015 (Act 891). Actual duty amounts are determined by Ghana Revenue Authority at time of clearance and may vary based on the BOG exchange rate on your declaration date, actual freight and insurance invoices, vehicle inspection findings, and the customs officer\'s valuation. Always consult a licensed clearing agent for your official assessment.',
  },
  {
    q: 'Can I import a bus or minibus?',
    a: 'Yes, provided it is within the 10-year age limit and is left-hand drive. However, buses and minibuses (M2/M3 vehicle categories) require Ghana Standards Authority (GSA) homologation certification in addition to standard customs clearance. You should consult a licensed clearing agent who handles commercial vehicles before proceeding.',
  }
];

export default function FAQ() {
  return (
    <>
      <div className="hero" style={{ padding: '40px 24px 48px' }}>
        <h1 style={{ fontSize: 32 }}>Frequently Asked Questions</h1>
        <p>Everything you need to know about Ghana vehicle import duty.</p>
      </div>

      <div className="container">
        <div className="page-content">
          {faqs.map((faq, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div className="card-body">
                <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--green)' }}>
                  {faq.q}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
          
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--green)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontFamily: "'DM Serif Display', serif", fontSize: 16 }}>
              Calculate Your Duty
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 CediDuty • Calculations based on Customs Act 2015 (Act 891)</p>
      </footer>
    </>
  );
}