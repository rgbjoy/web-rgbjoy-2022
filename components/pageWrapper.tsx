'use client';

import { useEffect } from "react";

const PageWrapper = ({ children, page = "", className = "" }) => {
  useEffect(() => {
    window.scrollTo({
      top:0,
      left:0,
    })
  }, []);
  return (
    <div className={`wrapper ${page ? page : ""} ${className}`}>
      {children}
    </div>
  )
}

export default PageWrapper
