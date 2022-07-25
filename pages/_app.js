import '../styles/global.scss';
import { AnimatePresence } from 'framer-motion'
import Header from '../components/header'
import Footer from '../components/footer.js'

export default function App({ Component, pageProps }) {
  return <>
    <Header />
    <AnimatePresence
      exitBeforeEnter
      initial={false}
      onExitComplete={() => window.scrollTo(0, 0)}
    >
      <Component {...pageProps} />
    </AnimatePresence>
    <Footer />
  </>
}