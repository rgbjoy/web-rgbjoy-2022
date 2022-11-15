import type { AppProps } from 'next/app'
import Head from 'next/head'

import { AnimatePresence } from 'framer-motion'

import 'normalize.css/normalize.css';
import "../styles/global.scss"

import SiteLayout from '../components/SiteLayout';
import { usePageLoading } from '../utils/isPageLoading';
import { usePageTransitionFix } from '../utils/usePageTransitionFix'
import { useRouter } from 'next/router';

export default function MyApp({ Component, pageProps }: AppProps) {
  usePageTransitionFix()
  const router = useRouter()
  const { isPageLoading } = usePageLoading();

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
          onExitComplete={() => {window.scrollTo(0, 0)}}
        >
          {isPageLoading ? <div className="loadingPage">...</div> : <Component {...pageProps} key={router.pathname} />}
        </AnimatePresence>
      </SiteLayout>
    </>
  )
}