import React, { useRef, useState } from 'react'
import { motion } from "framer-motion";

type Props = {
  children?: React.ReactNode
  page?: string
}

const variants = {
  hidden: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
}

const Layout = ({ children, page }: Props) => (
  <motion.div
    variants={variants}
    initial="hidden"
    animate="enter"
    exit="exit"
    transition={{ type: [0, 0.71, 0.2, 1.01], delay: 1, from: 0 }}
    className={`wrapper ${page ? page : ""}`}
  >
    {children}
  </motion.div>
)

export default Layout
