import { CupSoda, Wine, SprayCan, Leaf, Package, Fish, Trash2 } from 'lucide-react'

/* Mapa tipo de residuo → icono Lucide (sin emojis) */
const ICONOS = {
  plastico: CupSoda,
  vidrio: Wine,
  metal: SprayCan,
  organico: Leaf,
  papel: Package,
  redes: Fish,
  otro: Trash2,
}

export default function IconoTipo({ tipo, size = 16, className = '' }) {
  const Icono = ICONOS[tipo] || Trash2
  return <Icono size={size} className={className} />
}

export const COLOR_TIPO = {
  plastico: '#22c55e',
  vidrio: '#0ea5e9',
  metal: '#f59e0b',
  organico: '#84cc16',
  papel: '#a16207',
  redes: '#8b5cf6',
  otro: '#64748b',
}
