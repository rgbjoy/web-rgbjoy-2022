import type { AppProps } from 'next/app'
import Head from 'next/head'

import { AnimatePresence } from 'framer-motion'

import 'normalize.css/normalize.css';
import "../styles/global.scss"

import { useRouter } from 'next/router';

import SiteLayout from '../components/SiteLayout';



export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="theme-color" content="#121212" />
      </Head>
      <SiteLayout>
        <AnimatePresence
          mode="wait"
          exitBeforeEnter
          onExitComplete={() => window.scrollTo(0, 0)}
        >
          <Component {...pageProps} key={router.pathname} />
        </AnimatePresence>
      </SiteLayout>
    </>
  )
}