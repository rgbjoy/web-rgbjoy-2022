import type { AppProps } from 'next/app'
import Head from 'next/head'

import { AnimatePresence } from 'framer-motion'

import 'normalize.css/normalize.css';
import "../styles/global.scss"
import dynamic from 'next/dynamic';
import { Suspense } from 'react'
import { useRouter } from 'next/router';

const DynamicBackground = dynamic(
  () => import('../components/Background'),
  { loading: () => <div className="loading">...</div>, ssr: false }
)

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  return (
    <>
      <Suspense fallback={<div className="loading">...</div>}>
        <DynamicBackground page={router.pathname} />
      </Suspense>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="theme-color" content="#121212" />
        <link rel="apple-touch-icon" sizes="180x180" href="./social/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="./social/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="./social/favicon-16x16.png"/>
        <link rel="manifest" href="./social/site.webmanifest"/>
        <link rel="mask-icon" href="./social/safari-pinned-tab.svg" color="#5bbad5"/>
        <link rel="shortcut icon" href="./social/favicon.ico"/>
        <meta name="msapplication-TileColor" content="#da532c"/>
        <meta name="msapplication-config" content="./social/browserconfig.xml"/>
        <meta name="theme-color" content="#ffffff"/>
      </Head>

      <AnimatePresence
        exitBeforeEnter
        // initial={false}
        onExitComplete={() => window.scrollTo(0, 0)}
      >
        <Component {...pageProps} path={router.pathname} />
      </AnimatePresence>
    </>
  )
}