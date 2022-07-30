import type { AppProps } from 'next/app'
import Head from 'next/head'

import { AnimatePresence } from 'framer-motion'

import 'normalize.css/normalize.css';
import "../styles/global.scss"
import dynamic from 'next/dynamic';
import { Suspense } from 'react'

const DynamicHeader = dynamic(
  () => import('../components/Background'),
  { loading: () => <div className="loading">...</div>, ssr: false }
)

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Suspense fallback={<div className="loading">...</div>}>
        <DynamicHeader />
      </Suspense>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <AnimatePresence
        exitBeforeEnter
        // initial={false}
        onExitComplete={() => window.scrollTo(0, 0)}
      >
        <Component {...pageProps} />
      </AnimatePresence>
    </>
  )
}