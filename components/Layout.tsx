"use client"

import { motion } from "framer-motion";

type Props = {
  children?: React.ReactNode
  page?: string
}

const Layout = ({ children, page }: Props) => {

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.25, type: [0, 0.71, 0.2, 1.01] } }}
        exit={{ opacity: 0, transition: { duration: 0.25, type: [0, 0.71, 0.2, 1.01]} }}
        className={`wrapper ${page ? page : ""}`}
      >
        {children}
      </motion.div>
    </>
  )
}

export default Layout
