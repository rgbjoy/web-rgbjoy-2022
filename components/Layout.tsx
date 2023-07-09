const Layout = ({ children, page }) => {
  return (
    <div className={`wrapper ${page ? page : ""}`}>
      {children}
    </div>
  )
}

export default Layout
