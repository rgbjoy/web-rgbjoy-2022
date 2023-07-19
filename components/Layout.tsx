'use client';

import { SmoothScrollbar } from '@14islands/r3f-scroll-rig'

import { useEffect } from "react";

const Layout = ({ children, page = "", className = "" }) => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
    })
  }, []);
  return (
    <SmoothScrollbar>
      {(bind) => (
        <div {...bind} className={`wrapper ${page ? page : ""} ${className}`}>
          {children}
        </div>
      )}
    </SmoothScrollbar>
  )
}

export default Layout
