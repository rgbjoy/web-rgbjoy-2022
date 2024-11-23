import 'normalize.css/normalize.css'
import '../../styles/global.scss'

import { Analytics } from '@vercel/analytics/react'
import { Viewport } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { Montserrat } from 'next/font/google'
import localFont from 'next/font/local'

import SiteLayout from '@/components/siteLayout'
import { fetchSettings } from '@/components/fetchSettings'
import { use } from 'react'
import { getData } from '@/utilities/getData'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const montserrat = Montserrat({ subsets: ['latin'] })
const myFont = localFont({
  src: '../../../public/fonts/Rhode-Regular.woff2',
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
    ],
  },
}

export const viewport: Viewport = {
  themeColor: 'black',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const getLinks = async () => {
    const data = await fetchSettings()
    return data
  }
  const settingsData = use(getLinks())

  const getFooter = async () => {
    const payload = await getPayload({
      config: configPromise,
    })

    const data = await payload.findGlobal({
      slug: 'footer',
    })
    return data
  }
  const footerData = use(getFooter())

  const getHome = async () => {
    const query = `
    query getHome {
      page(id:"cG9zdDoxMQ==") {
        home {
          header
          subhead
          intro
          button
        }
      }
    }
  `
    const {
      data: {
        page: { home },
      },
    } = await getData(query)
    return home
  }
  const homeData = use(getHome())

  return (
    <html lang="en">
      <body className={`${montserrat.className} ${myFont.variable}`}>
        <SiteLayout
          settings={settingsData}
          homeData={homeData}
          footerData={footerData}
        >
          {children}
        </SiteLayout>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
