'use client';

const PageWrapper = ({ children, page = "", className = "" }) => {
  return (
    <div className={`wrapper ${page ? page : ""} ${className}`}>
      {children}
    </div>
  )
}

export default PageWrapper
