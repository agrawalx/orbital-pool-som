/**
 * Orbital AMM - Root Layout
 * 
 * Main application layout with metadata and font configuration.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Orbital AMM - Spherical Liquidity Protocol',
  description: 'Advanced AMM using spherical geometry and torus invariants for optimal capital efficiency on Arbitrum',
  keywords: ['DeFi', 'AMM', 'Arbitrum', 'Stylus', 'Liquidity', 'Orbital', 'Spherical Geometry'],
  authors: [{ name: 'Orbital Team' }],
  openGraph: {
    title: 'Orbital AMM - Spherical Liquidity Protocol',
    description: 'Advanced AMM using spherical geometry and torus invariants for optimal capital efficiency',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Orbital AMM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orbital AMM - Spherical Liquidity Protocol',
    description: 'Advanced AMM using spherical geometry and torus invariants for optimal capital efficiency',
    images: ['/og-image.png'],
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}