import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'RATER: Anonymous Verified Business Reviews on Hedera',
  description:
    'Submit anonymous, blockchain-verified business reviews. Every review is stored on Hedera Consensus Service and earns an NFT badge.',
  openGraph: {
    title: 'RATER',
    description: 'Anonymous verified business reviews on Hedera blockchain',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <div className="mesh-bg fixed inset-0 pointer-events-none" aria-hidden="true" />
        <div className="relative z-0">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
