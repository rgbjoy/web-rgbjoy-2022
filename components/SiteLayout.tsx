"use client"

import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation'
import style from './SiteLayout.module.scss'
import useWindowDimensions from '@/utilities/useWindowDimensions'
import NavLink from "./NavLink";

const DynamicBackground = dynamic(
  () => import('./Background'),
  { loading: () => <div className="loading">...</div>, ssr: false }
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

  const links = [
    { label: "/", path: '/', targetSegment: null, color: null },
    { label: 'Info', path: '/info', targetSegment: 'info', color: "red" },
    { label: 'Dev', path: '/dev', targetSegment: 'dev', color: "green" },
    { label: 'Art & Design', path: '/art', targetSegment: 'art', color: "blue" },
  ]

  const isNotFound = !links.some(link => link.path === '/' + pathname.split('/')[1]);

  const { width } = useWindowDimensions();

  return (
    <>
      <DynamicBackground page={isNotFound ? "404" : pathname} />

      {children}

      <motion.div
        initial={{ right: -20 }}
        animate={{ right: 60 }}
        transition={{ delay: 1, duration: 0.75, ease: "easeOut" }}
        className={"badge"}>
        2023 Portfolio
      </motion.div>

      <motion.header
        id="header"
        initial={{ top: -20 }}
        animate={{ top: width && (width < 800 ? 20 : 60) }}
        transition={{ delay: 0.25, duration: 0.75, ease: "easeOut" }}
        className={style.header}>
        <nav>
          {links.map((l, i) =>
            pathname === "/" && l.path === "/" ? null : <NavLink key={i} {...l} />
          )}
        </nav>
      </motion.header>

      <motion.footer
        id="footer"
        initial={{ bottom: width && (width < 800 ? -80 : -110) }}
        animate={{ bottom: 0 }}
        transition={{ delay: 0.25, duration: 0.75, ease: "easeOut" }}
        className={style.footer}>
        <Footer />
      </motion.footer>
    </>
  )
}

export default SiteLayout;