import React, { useRef, useState } from 'react'
import { motion } from "framer-motion";
import { useRouter } from 'next/router';
import ActiveLink from './ActiveLink';
import style from './Layout.module.scss'


type Props = {
  children?: React.ReactNode
  page?: string
}

const Layout = ({ children, page }: Props) => {
  const router = useRouter()

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: [0, 0.71, 0.2, 1.01] }}
        className={`wrapper ${page ? page : ""}`}
      >
        {children}
      </motion.div>

      <header className={style.header}>
        <nav>
          {router.pathname !== "/" ? <ActiveLink activeClassName={style.active} href="/">
            <a>/</a>
          </ActiveLink> : ""}
          <ActiveLink activeClassName={style.active} href="/info">
            <a>Info</a>
          </ActiveLink>
          <ActiveLink activeClassName={style.active} href="/work">
            <a>Work</a>
          </ActiveLink>
        </nav>
      </header>

      <div className={style.badge}>2022 Portfolio</div>

      <footer className={style.footer}>
        <div className={style.footerWrapper}>
          <div className={style.footerLinks}>
            <a target="_blank" rel="noreferrer" href="https://instagram.com/rgbjoy">Instagram</a>
            <a target="_blank" rel="noreferrer" href="https://twitter.com/rgbjoy">Twitter</a>
            <a target="_blank" rel="noreferrer" href="https://codepen.io/rgbjoy/pens/popular">Codepen</a>
            <a target="_blank" rel="noreferrer" href="https://github.com/rgbjoy/">Github</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Layout
