// app/layout.tsx

import { Inter, Poppins } from 'next/font/google'
import './globals.css'

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
    default: 'Import Export BF - Transport France Burkina Faso | Envoi de Colis',
    template: '%s | Import Export BF'
  },
  description: 'Entreprise d\'envoi de colis de la France vers le Burkina Faso depuis 8 ans. Colis standard 100€, Transport barrique 100€, Ramassage domicile disponible.',
  keywords: [
    'envoi colis Burkina Faso',
    'transport France Burkina',
    'Import Export BF',
    'colis Ouagadougou',
    'colis Bobo-Dioulasso',
    'ramassage domicile',
    'transport barrique',
    'livraison Burkina Faso',
    'diaspora burkinabè'
  ],
  authors: [{ name: 'Import Export BF' }],
  creator: 'Import Export BF',
  publisher: 'Import Export BF',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://import-export-bf.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://import-export-bf.vercel.app',
    title: 'Import Export BF - Transport France Burkina Faso',
    description: 'Service d\'envoi de colis de la France vers le Burkina Faso depuis 8 ans. Tarifs transparents dès 100€.',
    siteName: 'Import Export BF',
    images: [
      {
        url: 'https://import-export-bf.vercel.app/logo-1200x630.jpg', 
        width: 1200,
        height: 630,
        alt: 'Import Export BF - Service d\'envoi de colis France Burkina Faso',
        type: 'image/jpeg',
      },
      {
        url: 'https://import-export-bf.vercel.app/logo-1200x630.jpg', 
        width: 1200,
        height: 630,
        alt: 'Import Export BF - Transport et logistique',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Import Export BF - Transport France Burkina Faso',
    description: 'Service d\'envoi de colis vers le Burkina Faso depuis 8 ans. Tarifs transparents dès 100€.',
    images: [
      {
        url: 'https://import-export-bf.vercel.app/logo-1200x630.jpg',
        alt: 'Import Export BF - Service d\'envoi de colis France Burkina Faso',
      }
    ],
    creator: '@ImportExportBF',
    site: '@ImportExportBF',
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
  icons: {
    icon: [
      { url: '/logo_short-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo_short-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo_short-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#010066',
      },
    ],
  },
  manifest: '/site.webmanifest',
  // JSON-LD pour le référencement (URLs absolues aussi)
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Import Export BF',
      description: 'Service d\'envoi de colis de la France vers le Burkina Faso',
      url: 'https://import-export-bf.vercel.app',
      logo: 'https://import-export-bf.vercel.app/logo-1200x630.jpg',
      image: 'https://import-export-bf.vercel.app/og-image.jpg',
      telephone: ['+33670699823', '+22676601981'],
      email: 'contact@ieBF.fr',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'FR',
        addressLocality: 'France',
      },
      sameAs: [
        'https://facebook.com/ieBF',
        'https://instagram.com/ieBF',
      ],
      serviceArea: ['France', 'Burkina Faso'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services d\'envoi',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Colis Standard',
            description: 'Envoi de colis jusqu\'à 30kg',
            price: '100', 
            priceCurrency: 'EUR',
          },
          {
            '@type': 'Offer',
            name: 'Transport Barrique',
            description: 'Transport de contenants lourds',
            price: '100',
            priceCurrency: 'EUR',
          },
        ],
      },
    }),
  },
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/logo_short-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo_short-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/logo_short-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo_short.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#010066" />
        <meta name="msapplication-TileColor" content="#010066" />
        <meta name="msapplication-TileImage" content="/logo_short-144x144.png" />
      </head>
      <body className={`font-sans min-h-screen bg-background antialiased`}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}