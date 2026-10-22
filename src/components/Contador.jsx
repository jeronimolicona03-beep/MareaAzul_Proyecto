import { useEffect, useRef, useState } from 'react'
import { useInView, animate } from 'framer-motion'

/** Contador numérico que anima al entrar en pantalla */
export default function Contador({ hasta, sufijo = '', prefijo = '', duracion = 1.6, decimales = 0 }) {
  const ref = useRef(null)
  const estaEnVista = useInView(ref, { once: true, margin: '-40px' })
  const [valor, setValor] = useState(0)

  useEffect(() => {
    if (!estaEnVista) return
    const controls = animate(0, hasta, {
      duration: duracion,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValor(v),
    })
    return () => controls.stop()
  }, [estaEnVista, hasta, duracion])

  const texto = decimales > 0
    ? valor.toFixed(decimales)
    : Math.round(valor).toLocaleString('es-CO')

  return (
    <span ref={ref}>
      {prefijo}
      {texto}
      {sufijo}
    </span>
  )
}
