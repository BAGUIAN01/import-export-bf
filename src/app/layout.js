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
    default: 'IE Global - Transport France Burkina Faso | Envoi de Colis',
    template: '%s | IE Global'
  },
  description: 'Service familial d\'envoi de colis de la France vers le Burkina Faso depuis 8 ans. Colis standard 20€, Transport barrique 100€, Ramassage domicile disponible.',
  keywords: [
    'envoi colis Burkina Faso',
    'transport France Burkina',
    'IE Global',
    'colis Ouagadougou',
    'colis Bobo-Dioulasso',
    'ramassage domicile',
    'transport barrique',
    'livraison Burkina Faso',
    'diaspora burkinabè',
    'service familial'
  ],
  authors: [{ name: 'IE Global' }],
  creator: 'IE Global',
  publisher: 'IE Global',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ieglobal.fr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://ieglobal.fr',
    title: 'IE Global - Transport France Burkina Faso',
    description: 'Service familial d\'envoi de colis de la France vers le Burkina Faso depuis 8 ans. Tarifs transparents dès 20€.',
    siteName: 'IE Global',
    images: [
      {
        url: '/logo.jpg', // Votre logo comme image principale
        width: 1200,
        height: 630,
        alt: 'IE Global - Service d\'envoi de colis France Burkina Faso',
        type: 'image/jpeg',
      },
      {
        url: '/og-image.jpg', // Image alternative si vous en avez une
        width: 1200,
        height: 630,
        alt: 'IE Global - Transport et logistique',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IE Global - Transport France Burkina Faso',
    description: 'Service familial d\'envoi de colis vers le Burkina Faso depuis 8 ans. Tarifs transparents dès 20€.',
    images: [
      {
        url: '/logo.jpg',
        alt: 'IE Global - Service d\'envoi de colis France Burkina Faso',
      }
    ],
    creator: '@ieglobal',
    site: '@ieglobal',
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
  // Métadonnées supplémentaires pour le logo
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
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
  // JSON-LD pour le référencement
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'IE Global',
      description: 'Service familial d\'envoi de colis de la France vers le Burkina Faso',
      url: 'https://ieglobal.fr',
      logo: 'https://ieglobal.fr/logo.jpg',
      image: 'https://ieglobal.fr/logo.jpg',
      telephone: ['+33670699823', '+22676601981'],
      email: 'contact@ieglobal.fr',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'FR',
        addressLocality: 'France',
      },
      sameAs: [
        'https://facebook.com/ieglobal',
        'https://instagram.com/ieglobal',
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
            price: '20',
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
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#010066" />
        <meta name="msapplication-TileColor" content="#010066" />
        <meta name="msapplication-TileImage" content="/favicon-144x144.png" />
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