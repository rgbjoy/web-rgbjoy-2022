"use client"

import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import style from './SiteLayout.module.scss'
import useWindowDimensions from '../utilites/useWindowDimensions'

const DynamicBackground = dynamic(
  () => import('./Background'),
  { loading: () => <div className="loadingBackground">...</div>, ssr: false }
)

const Footer = () => {
  return (
    <div className={style.footerWrapper}>
      <div className={style.footerLinks}>
        <a target="_blank" rel="noreferrer" href="https://instagram.com/rgbjoy">Instagram</a>
        <a target="_blank" rel="noreferrer" href="https://twitter.com/rgbjoy">Twitter</a>
        <a target="_blank" rel="noreferrer" href="https://codepen.io/rgbjoy/pens/popular">Codepen</a>
        <a target="_blank" rel="noreferrer" href="https://github.com/rgbjoy/">Github</a>
      </div>
    </div>
  )
}

const SiteLayout = ({ children }) => {
  const pathname = usePathname()

  const { width } = useWindowDimensions();

  return (
    <>
      <Suspense fallback={<div className="loadingBackground">...</div>}>
        <DynamicBackground page={pathname} />
      </Suspense>

      {children}

      <motion.div
        initial={{ right: -20 }}
        animate={{ right: 60 }}
        transition={{ delay: 1, duration: 0.75, ease:"easeOut" }}
        className={"badge"}>
        2023 Portfolio
      </motion.div>

      <motion.header
        id="header"
        initial={{ top: -20 }}
        animate={{ top: width && (width < 800 ? 20 : 60) }}
        transition={{ delay: 0.25, duration: 0.75, ease:"easeOut" }}
        className={style.header}>
        <nav>
          <Link href="/">
            \
          </Link>
          <Link data-color="red" href="/info">
            Info
          </Link>
          <Link data-color="green" href="/dev">
            Dev
          </Link>
          <Link data-color="blue" href="/art">
            Art & Design
          </Link>
        </nav>
      </motion.header>

      <motion.footer
        id="footer"
        initial={{ bottom: width && (width < 800 ? -80 : -110) }}
        animate={{ bottom: 0 }}
        transition={{ delay: 0.25, duration: 0.75, ease:"easeOut" }}
        className={style.footer}>
        <Footer />
      </motion.footer>
    </>
  )
}

export default SiteLayout;