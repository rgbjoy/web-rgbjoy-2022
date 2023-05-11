import Head from 'next/head'
import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react';

import { AnimatePresence } from 'framer-motion'

import { Montserrat } from 'next/font/google'
import localFont from 'next/font/local'

import 'normalize.css/normalize.css';
import "../styles/global.scss"

import SiteLayout from '../components/SiteLayout';
import { usePageTransitionFix } from '../utils/usePageTransitionFix'
import { useRouter } from 'next/router';

const montserrat = Montserrat({ subsets: ['latin'] })
const myFont = localFont({
  src: '../asset/fonts/Rhode-MediumWide.woff2',
  variable: '--rhode-font',
})

export default function MyApp({ Component, pageProps }: AppProps) {
  usePageTransitionFix()
  const router = useRouter()

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main className={`${montserrat.className} ${myFont.variable}`}>
        <SiteLayout>
          <AnimatePresence
            mode="wait"
            onExitComplete={() => { window.scrollTo(0, 0) }}
          >
            <Component {...pageProps} key={router.pathname} />
          </AnimatePresence>
        </SiteLayout>
        <Analytics />
      </main>
    </>
  )
}