'use client';

import { useEffect } from "react";

const Layout = ({ children, page }) => {
  useEffect(() => {
    window.scrollTo({
      top:0,
      left:0,
    })
  }, []);
  return (
    <div className={`wrapper ${page ? page : ""}`}>
      {children}
    </div>
  )
}

export default Layout
