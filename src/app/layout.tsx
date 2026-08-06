import type { Metadata } from 'next'
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import Providers from './providers'
// Imported for its side effect: validates required env vars at startup
// and throws immediately with a clear message if any are missing or
// malformed, rather than failing confusingly deep inside a fetch call.
import '@/config/env'

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MomCare Web',
  description: 'Clinical decision support system',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-surface text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
