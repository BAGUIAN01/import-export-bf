// app/layout.tsx

import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Header } from '@/src/components/layout/header'
import { Footer } from '@/src/components/layout/footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'Import Export - Solutions Logistiques Internationales',
    template: '%s | Import Export'
  },
  description: 'Spécialiste en commerce international, logistique, dédouanement et transport. Solutions complètes pour vos échanges commerciaux mondiaux.',
  keywords: [
    'import', 
    'export', 
    'logistique', 
    'dédouanement', 
    'transport international', 
    'commerce international',
    'fret maritime',
    'fret aérien',
    'transport routier',
    'entreposage',
    'douane'
  ],
  authors: [{ name: 'Import Export' }],
  creator: 'Import Export',
  publisher: 'Import Export',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://import-export.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://import-export.com',
    title: 'Import Export - Solutions Logistiques Internationales',
    description: 'Spécialiste en commerce international, logistique, dédouanement et transport. Votre partenaire de confiance pour tous vos échanges commerciaux mondiaux.',
    siteName: 'Import Export',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Import Export - Solutions Logistiques',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Import Export - Solutions Logistiques Internationales',
    description: 'Spécialiste en commerce international, logistique, dédouanement et transport.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#002856" />
        <meta name="msapplication-TileColor" content="#002856" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}