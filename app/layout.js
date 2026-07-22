// app/layout.js
import Script from 'next/script'
import { TokenProvider } from './Context/TokenContext'
import Navbar from './components/Navbar'
import './globals.css'

export const metadata = {
  title: 'GhanaDuty — Vehicle Import Duty Calculator',
  description: 'Calculate Ghana Customs import duty for any vehicle from any country. Uses live MSRP data and Bank of Ghana exchange rates. Accurate, fast, and legally compliant with Customs Act 2015 (Act 891).',
  keywords: 'Ghana vehicle import duty, Ghana customs calculator, car import duty Ghana, GRA duty calculator, Tema port import duty',
  openGraph: {
    title: 'GhanaDuty — Ghana Vehicle Import Duty Calculator',
    description: 'Calculate Ghana Customs import duty for any vehicle. Live MSRP + Bank of Ghana rates.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        
        {/* Load Paystack Inline SDK Globally */}
        <Script 
          src="https://js.paystack.co/v1/inline.js" 
          strategy="lazyOnload" 
        />
      </head>
      <body>
        <TokenProvider>
          <Navbar /> {/* This anchors the dynamic token header globally */}
          {children}
        </TokenProvider>
      </body>
    </html>
  );
}