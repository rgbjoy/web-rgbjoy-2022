import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import { Suspense } from 'react'
import { useRouter } from 'next/router';
import ActiveLink from "./ActiveLink";
import style from './SiteLayout.module.scss'
import useWindowDimensions from '../utils/useWindowDimensions'

import { gql } from "@apollo/client";
import { client } from "../data/app";

const DynamicBackground = dynamic(
  () => import('./Background'),
  { loading: () => <div className="loadingBackground">...</div>, ssr: false }
)

const SiteLayout = ({ children }) => {
  const router = useRouter()

  const { width } = useWindowDimensions();

  const paths = router.pathname.split("/").filter(a => a.length > 0).length

  return (
    <>
      <Suspense fallback={<div className="loadingBackground">...</div>}>
        <DynamicBackground page={router.pathname} />
      </Suspense>
      <motion.div
        initial={{ right: -20 }}
        animate={{ right: 60 }}
        transition={{ delay: 0.25, duration: 0.75, ease:"easeOut" }}
        className={style.badge}>
        2022 Portfolio
      </motion.div>

      {children}

      <motion.header
        initial={{ top: -20 }}
        animate={{ top: width < 800 ? 20 : 60 }}
        transition={{ delay: 0.25, duration: 0.75, ease:"easeOut" }}
        className={style.header}>
        <nav>
          {router.pathname !== "/" ? <ActiveLink activeClassName={style.active} href="/">
            .{paths < 2 ? `.` : ``}<span>/</span>
          </ActiveLink> : ""}
          <ActiveLink activeClassName={style.active} href="/info">
            Info
          </ActiveLink>
          <ActiveLink activeClassName={style.active} href="/dev">
            Dev
          </ActiveLink>
          <ActiveLink activeClassName={style.active} href="/art">
            Art
          </ActiveLink>
        </nav>
      </motion.header>

      <motion.footer
        id="footer"
        initial={{ bottom: width < 800 ? -80 : -110 }}
        animate={{ bottom: 0 }}
        transition={{ delay: 0.25, duration: 0.75, ease:"easeOut" }}
        className={style.footer}>
        <div className={style.footerWrapper}>
          <div className={style.footerLinks}>
            <a target="_blank" rel="noreferrer" href="https://instagram.com/rgbjoy">Instagram</a>
            <a target="_blank" rel="noreferrer" href="https://twitter.com/rgbjoy">Twitter</a>
            <a target="_blank" rel="noreferrer" href="https://codepen.io/rgbjoy/pens/popular">Codepen</a>
            <a target="_blank" rel="noreferrer" href="https://github.com/rgbjoy/">Github</a>
          </div>
        </div>
      </motion.footer>
    </>
  )
}

export default SiteLayout;