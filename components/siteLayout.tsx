"use client"

import React, { useEffect, useRef, useState } from 'react';
import { motion } from "framer-motion";
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic';
import style from './siteLayout.module.scss'
import NavLink from "./navLink";

const DynamicBackground = dynamic(
  () => import('./background/background'),
  { loading: () => <div className="loading">...</div>, ssr: false }
)

const Footer = ({ footerLinks }) => {
  return (
    <div className={style.footerWrapper}>
      <div className={style.footerLinks}>
        {footerLinks.map(item => (
          <a key={item.link.title} target="_blank" rel="noreferrer" href={item.link.url}>
            {item.link.title}
          </a>
        ))}
      </div>
    </div>
  );
}

const SiteLayout = ({ children, settings }) => {
  const pathname = usePathname()

  const [isScrolled, setIsScrolled] = useState(false);
  const innerVariants = {
    scrolled: {
      height: "60px",
      borderBottom: "1px dotted",
      borderColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)"
    },
    notScrolled: {
      height: "100%",
      borderBottom: "1px dotted",
      borderColor: "rgba(0, 0, 0, 0)",
      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)"
    }
  };

  // hamburger
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Function to toggle the menu state
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const header = document.getElementById('header');
      if (header) {
        const headerHeight = header.offsetHeight;
        const scrollY = window.scrollY;

        if (scrollY > headerHeight) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const links = [
    { label: "/", path: '/', targetSegment: null, color: null },
    { label: 'Info', path: '/info', targetSegment: 'info', color: "red" },
    { label: 'Dev', path: '/dev', targetSegment: 'dev', color: "green" },
    { label: 'Art & Design', path: '/art', targetSegment: 'art', color: "blue" },
    { label: 'Thoughts', path: '/posts', targetSegment: 'posts', color: "yellow" },
  ]

  const isNotFound = !links.some(link => link.path === '/' + pathname.split('/')[1]);

  return (
    <>
      <DynamicBackground settings={settings} page={isNotFound ? "404" : pathname} />

      {children}

      <div id="header" className={`${style.header} ${isMenuOpen ? style.menuOpen : ''}`}>
        <motion.div
          variants={innerVariants}
          initial="notScrolled"
          animate={isScrolled ? "scrolled" : "notScrolled"}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
          className={style.header_inner}
          ref={menuRef}
        >
          <button onClick={toggleMenu} type="button" className={style.hamburgerMenu}>
            {isMenuOpen ? `- Close` : `+ Menu`}
          </button>
          <nav>
            {links.map((l, i) =>
              pathname === "/" && l.path === "/" ? null : <NavLink key={i} {...l} closeMenu={closeMenu} />
            )}
          </nav>
        </motion.div>
      </div>

      <motion.footer id="footer" className={style.footer}>
        {settings?.footerLinks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.75, ease: "easeOut" }}
          >
            <Footer footerLinks={settings.footerLinks} />
          </motion.div>
        )}
      </motion.footer>

      {settings?.badge && <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.75, ease: "easeOut" }}
        className={"badge"}>
        {settings.badge}
      </motion.div>}
    </>
  )
}

export default SiteLayout;