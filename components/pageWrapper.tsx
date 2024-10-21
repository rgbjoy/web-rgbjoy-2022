'use client'

const PageWrapper = ({ children, page = '', className = '' }) => {
  return (
    <div className={`wrapper ${page ? page : ''} ${className}`}>
      <div className="wrapper-inner">{children}</div>
    </div>
  )
}

export default PageWrapper
