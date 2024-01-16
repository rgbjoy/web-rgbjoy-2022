import 'normalize.css/normalize.css';
import '../styles/global.scss';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Viewport } from 'next'

import { Montserrat } from 'next/font/google'
import localFont from 'next/font/local'

import SiteLayout from "@/components/siteLayout"
import { fetchSettings } from '@/components/fetchSettings';
import { use } from 'react';

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
  openGraph: {
    description: 'Multidisciplinary digital creator & software engineer',
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

export const viewport: Viewport = {
  themeColor: 'black',
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const getLinks = async () => {
    const data = await fetchSettings();
    return data;
  }
  const settings = use(getLinks());
  return (
    <html lang="en">
      <body className={`${montserrat.className} ${myFont.variable}`}>
        <SiteLayout settings={settings}>
          {children}
        </SiteLayout>
        <Analytics />
      </body>
    </html>
  )
}
