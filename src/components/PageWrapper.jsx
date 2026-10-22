import { motion } from 'framer-motion'

/** Transición estándar de cada página */
export default function PageWrapper({ children, className = '' }) {
  return (
    <motion.main
      className={className}
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  )
}
