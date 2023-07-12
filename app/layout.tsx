import 'normalize.css/normalize.css';
import '../styles/global.scss';

import { Analytics } from '@vercel/analytics/react';
import { Montserrat } from 'next/font/google'
import localFont from 'next/font/local'

import SiteLayout from "@/components/SiteLayout"

const montserrat = Montserrat({ subsets: ['latin'] })
const myFont = localFont({
  src: '../public/fonts/Rhode-Regular.woff2',
  variable: '--rhode-font',
})

export const metadata = {
  metadataBase: new URL('https://rgbjoy.com'),
  icons: {
    icon: '/social/icon.png',
  },
  themeColor: 'black',
  openGraph: {
    title: 'Tom Fletcher',
    description: 'Multidisciplinary digital creator & web engineer',
    url: 'https://rgbjoy.com',
    siteName: 'RGBJOY',
    images: [
      {
        url: '/social/opengraph-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    creator: '@rgbjoy',
    images: [
      {
        url: '/social/opengraph-image.png',
        width: 1200,
        height: 630,
      },
    ]
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} ${myFont.variable}`}>
        <SiteLayout>
          {children}
        </SiteLayout>
        <Analytics />
      </body>
    </html>
  )
}
