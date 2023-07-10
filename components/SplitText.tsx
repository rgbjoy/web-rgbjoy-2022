import { motion } from 'framer-motion'

export function SplitText({ children }) {
  let letters = children.split('')
  return letters.map((letter, i) => {
    return (
      <div
        key={children + i}
        style={{ display: 'inline-block', overflow: 'hidden' }}
      >
        <motion.div
          initial={{ opacity: 0, y: '10%' }}
          animate="visible"
          variants={{
            visible: i => ({
              opacity: 1,
              y: 0,
              transition: {
                type: "circOut",
                delay: i * 0.1
              }
            })
          }}
          style={{ display: 'inline-block', willChange: 'transform' }}
          custom={i}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.div>
      </div>
    )
  })
}
