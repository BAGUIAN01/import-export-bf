// app/admin/layout.tsx
import '../globals.css'
import { Inter, Poppins } from 'next/font/google'


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


export default function AdminLayout({
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
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}