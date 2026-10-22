import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, PieChart, BarChart3, Target, Trash2, MapPinned, Activity,
  Lightbulb, CalendarRange, Layers, Grid3x3, GitCompareArrows, Timer,
} from 'lucide-react'
import PageWrapper from '../components/PageWrapper.jsx'
import Contador from '../components/Contador.jsx'
import IconoTipo from '../components/IconoTipo.jsx'
import { useReportes } from '../store/ReportesContext.jsx'
import { MESES, ESTADOS, TIPOS_RESIDUO, ZONAS, CRONOGRAMA } from '../data/mock.js'

const subir = {
  oculto: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
}

const COLORES_ESTADO = { pendiente: '#f59e0b', verificado: '#0ea5e9', jornada: '#8b5cf6', resuelto: '#22c55e' }

/* ============================================================
   Sparkline para las tarjetas KPI
   ============================================================ */
function Sparkline({ serie, color = '#16a34a' }) {
  const w = 84
  const h = 30
  const max = Math.max(...serie, 1)
  const pts = serie.map((v, i) => [
    (i / Math.max(serie.length - 1, 1)) * w,
    h - 3 - (v / max) * (h - 8),
  ])
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
      />
      <motion.circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="3.4"
        fill="white"
        stroke={color}
        strokeWidth="2.4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 340, damping: 14 }}
      />
    </svg>
  )
}

/* ============================================================
   Barras horizontales animadas (con icono opcional)
   ============================================================ */
function BarrasH({ datos, color = null }) {
  const max = Math.max(...datos.map((d) => d.total), 1)
  return (
    <div>
      {datos.map((d, i) => (
        <div className="barra-fila" key={d.id || d.nombre}>
          <div className="barra-etiqueta">
            <span className="flex-centro gap-1">
              {d.icono}
              {d.nombre}
            </span>
            <span>{d.total}{d.sufijo || ''}</span>
          </div>
          <div className="barra-riel">
            <motion.div
              className="barra-relleno"
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.total / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.09, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={color ? { background: color } : d.color ? { background: d.color } : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   Columnas verticales (kg por zona)
   ============================================================ */
function Columnas({ datos, color = ['#22c55e', '#15803d'] }) {
  const max = Math.max(...datos.map((d) => d.total), 1)
  return (
    <div className="columnas-envoltura">
      {datos.map((d, i) => (
        <div key={d.id || d.nombre} className="columna">
          <motion.span
            className="columna-valor"
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
          >
            {d.total}
          </motion.span>
          <div className="columna-riel">
            <motion.div
              className="columna-relleno"
              initial={{ height: '0%' }}
              whileInView={{ height: `${Math.max((d.total / max) * 100, 3)}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 + i * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: `linear-gradient(180deg, ${color[0]}, ${color[1]})` }}
            />
          </div>
          <span className="columna-label" title={d.nombre}>{d.corto || d.nombre}</span>
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   Barras apiladas: estado × zona
   ============================================================ */
function Apiladas({ filas }) {
  const max = Math.max(...filas.map((f) => f.total), 1)
  return (
    <div>
      <div className="flex gap-2 envolver mb-2" style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--texto-suave)' }}>
        {Object.values(ESTADOS).map((e) => (
          <span key={e.id} className="flex-centro gap-1">
            <i style={{ width: 10, height: 10, borderRadius: 3, background: COLORES_ESTADO[e.id], display: 'inline-block' }} />
            {e.nombre}
          </span>
        ))}
      </div>
      {filas.map((f, i) => (
        <div key={f.id} className="barra-fila">
          <div className="barra-etiqueta">
            <span>{f.nombre}</span>
            <span>{f.total}</span>
          </div>
          <div className="barra-riel" style={{ display: 'flex', height: 15, borderRadius: 999, overflow: 'hidden' }}>
            {Object.keys(COLORES_ESTADO).map((estado) => {
              const v = f.porEstado[estado] || 0
              if (!v) return null
              return (
                <motion.div
                  key={estado}
                  title={`${ESTADOS[estado].nombre}: ${v}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(v / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: COLORES_ESTADO[estado], height: '100%', minWidth: 4 }}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   Matriz de calor: tipo × zona
   ============================================================ */
function MatrizCalor({ reportes }) {
  const zonas = ZONAS.slice(0, 7)
  const tipos = TIPOS_RESIDUO
  const conteo = zonas.map((z) =>
    tipos.map((t) => reportes.filter((r) => r.zona === z.id && r.tipo === t.id).length),
  )
  const max = Math.max(1, ...conteo.flat())

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="matriz-tabla">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Zona / Tipo</th>
            {tipos.map((t) => (
              <th key={t.id} title={t.nombre}>
                <span style={{ color: '#22c55e' }}><IconoTipo tipo={t.id} size={15} /></span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zonas.map((z, zi) => (
            <tr key={z.id}>
              <td className="matriz-zona">{z.nombre.split(' – ')[0]}</td>
              {tipos.map((t, ti) => {
                const v = conteo[zi][ti]
                const op = v ? 0.18 + (v / max) * 0.8 : 0
                return (
                  <td key={t.id}>
                    <motion.span
                      className="matriz-celda"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: (zi + ti) * 0.025, duration: 0.35 }}
                      style={{
                        background: v ? `rgba(21, 128, 61, ${op})` : '#f4faf5',
                        color: v && op > 0.55 ? 'white' : v ? '#14532d' : '#b7c9bc',
                      }}
                      title={`${z.nombre} · ${t.nombre}: ${v} reporte(s)`}
                    >
                      {v || '·'}
                    </motion.span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex-centro gap-1 mt-2" style={{ fontSize: '0.74rem', color: 'var(--texto-suave)', fontWeight: 600 }}>
        <span>Menor</span>
        <i style={{ width: 74, height: 9, borderRadius: 99, background: 'linear-gradient(90deg,#f4faf5,rgba(21,128,61,.55),#15803d)', display: 'inline-block' }} />
        <span>Mayor frecuencia</span>
      </div>
    </div>
  )
}

/* ============================================================
   Línea doble: reportes vs resueltos por mes
   ============================================================ */
function LineaDoble({ datos }) {
  const ancho = 560
  const alto = 210
  const pad = { top: 20, right: 20, bottom: 34, left: 30 }
  const max = Math.max(1, ...datos.flatMap((d) => [d.total, d.resueltos]))
  const X = (i) => pad.left + (i * (ancho - pad.left - pad.right)) / Math.max(datos.length - 1, 1)
  const Y = (v) => pad.top + (1 - v / max) * (alto - pad.top - pad.bottom)
  const trazar = (key) => datos.map((d, i) => `${i === 0 ? 'M' : 'L'}${X(i)},${Y(d[key])}`).join(' ')

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} style={{ width: '100%', height: 'auto' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={pad.left} y1={pad.top + f * (alto - pad.top - pad.bottom)} x2={ancho - pad.right} y2={pad.top + f * (alto - pad.top - pad.bottom)} stroke="#e8f6ec" strokeWidth="1" />
      ))}
      <motion.path
        d={trazar('total')} fill="none" stroke="#0284c7" strokeWidth="3.4" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d={trazar('resueltos')} fill="none" stroke="#16a34a" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="1 9" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
      {datos.map((d, i) => (
        <g key={d.nombre}>
          <motion.circle cx={X(i)} cy={Y(d.total)} r="6" fill="white" stroke="#0284c7" strokeWidth="3"
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 + i * 0.1, type: 'spring', stiffness: 340, damping: 15 }} />
          <motion.circle cx={X(i)} cy={Y(d.resueltos)} r="6" fill="white" stroke="#16a34a" strokeWidth="3"
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.85 + i * 0.1, type: 'spring', stiffness: 340, damping: 15 }} />
          <text x={X(i)} y={alto - 10} textAnchor="middle" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, fill: '#4e7360' }}>
            {d.nombre}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* ============================================================
   Dona animada
   ============================================================ */
function Dona({ datos, tamano = 176 }) {
  const total = datos.reduce((s, d) => s + d.total, 0) || 1
  const radio = 62
  const circ = 2 * Math.PI * radio
  let acumulado = 0

  return (
    <div className="dona-envoltura">
      <div style={{ position: 'relative', width: tamano, height: tamano, flexShrink: 0 }}>
        <svg width={tamano} height={tamano} viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radio} fill="none" stroke="#f0fdf4" strokeWidth="22" />
          {datos.map((d, i) => {
            const frac = d.total / total
            const largo = frac * circ
            const offset = acumulado * circ
            acumulado += frac
            return (
              <motion.circle
                key={d.id}
                cx="80" cy="80" r={radio}
                fill="none"
                stroke={d.color}
                strokeWidth="22"
                strokeDasharray={`${largo} ${circ - largo}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 80 80)"
                initial={{ opacity: 0, scale: 0.82 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: '80px 80px', cursor: 'pointer' }}
              >
                <title>{d.nombre}: {d.total}</title>
              </motion.circle>
            )
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--fuente-titulo)', fontWeight: 800, fontSize: '1.9rem', color: 'var(--verde-800)', lineHeight: 1 }}>
              <Contador hasta={total} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--texto-suave)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              reportes
            </div>
          </div>
        </div>
      </div>

      <div className="dona-leyenda">
        {datos.map((d, i) => (
          <motion.div
            key={d.id}
            className="dona-leyenda-fila"
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.5 }}
          >
            <i style={{ background: d.color }} />
            <span className="flex-centro gap-1">{d.icono}{d.nombre}</span>
            <b>{d.total}</b>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   Línea de evolución con área
   ============================================================ */
function LineaEvolucion({ datos }) {
  const ancho = 560
  const alto = 210
  const pad = { top: 22, right: 18, bottom: 34, left: 30 }
  const max = Math.max(...datos.map((d) => d.total), 1)

  const pts = datos.map((d, i) => ({
    x: pad.left + (i * (ancho - pad.left - pad.right)) / Math.max(datos.length - 1, 1),
    y: pad.top + (1 - d.total / max) * (alto - pad.top - pad.bottom),
    ...d,
  }))
  const linea = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${linea} L${pts[pts.length - 1].x},${alto - pad.bottom} L${pts[0].x},${alto - pad.bottom} Z`

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = pad.top + f * (alto - pad.top - pad.bottom)
        return <line key={f} x1={pad.left} y1={y} x2={ancho - pad.right} y2={y} stroke="#e8f6ec" strokeWidth="1" />
      })}

      <motion.path d={area} fill="url(#areaGrad)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, duration: 0.8 }} />

      <motion.path
        d={linea} fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      />

      {pts.map((p, i) => (
        <motion.g key={p.nombre} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.18, type: 'spring', stiffness: 320, damping: 15 }}>
          <circle cx={p.x} cy={p.y} r="7.5" fill="white" stroke="#16a34a" strokeWidth="3.5" />
          <text x={p.x} y={p.y - 15} textAnchor="middle" style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 13, fill: '#14532d' }}>
            {p.total}
          </text>
          <text x={p.x} y={alto - 10} textAnchor="middle" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, fill: '#4e7360' }}>
            {p.nombre}
          </text>
        </motion.g>
      ))}
    </svg>
  )
}

/* ============================================================
   Anillo de progreso
   ============================================================ */
function Anillo({ porcentaje, etiqueta, color = '#16a34a', tamano = 148 }) {
  const radio = 58
  const circ = 2 * Math.PI * radio
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="anillo-posicion" style={{ width: tamano, height: tamano }}>
        <svg width={tamano} height={tamano} viewBox="0 0 148 148">
          <circle cx="74" cy="74" r={radio} fill="none" stroke="#f0fdf4" strokeWidth="15" />
          <motion.circle
            cx="74" cy="74" r={radio} fill="none" stroke={color} strokeWidth="15" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            whileInView={{ strokeDashoffset: circ - (porcentaje / 100) * circ }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            transform="rotate(-90 74 74)"
          />
        </svg>
        <span className="anillo-valor" style={{ fontSize: '1.85rem' }}>
          <Contador hasta={porcentaje} sufijo="%" duracion={1.5} />
        </span>
      </div>
      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--texto-suave)', marginTop: 6 }}>{etiqueta}</div>
    </div>
  )
}

/* ============================================================
   Cronograma Gantt del anteproyecto
   ============================================================ */
function Cronograma() {
  const mesesNombres = ['M1', 'M2', 'M3', 'M4', 'M5']
  return (
    <div className="gantt">
      <div className="gantt-cab">
        <span>Actividad</span>
        {mesesNombres.map((m) => <span key={m} className="gantt-mes">{m}</span>)}
      </div>
      {CRONOGRAMA.map((a, i) => (
        <div className="gantt-fila" key={a.actividad}>
          <span className="gantt-nombre">{a.actividad}</span>
          <div className="gantt-pista">
            <motion.div
              className="gantt-barra"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{
                left: `${((a.meses[0] - 1) / 5) * 100}%`,
                width: `${((a.meses[a.meses.length - 1] - a.meses[0] + 1) / 5) * 100}%`,
                transformOrigin: 'left center',
              }}
            >
              {a.meses.length > 1 ? `${a.meses.length} meses` : '1 mes'}
            </motion.div>
          </div>
        </div>
      ))}
      <p className="grafica-sub" style={{ marginTop: 14 }}>
        Duración total estimada: 5 meses · Grupos de investigación: GIIN y GIPED (Universidad Cooperativa de Colombia)
      </p>
    </div>
  )
}

/* ============================================================
   Página
   ============================================================ */
export default function Indicadores() {
  const { reportes, porZona, porTipo, porEstado, kgTotal, porcentajeResuelto, total } = useReportes()

  const serieSemanal = useMemo(() => {
    const base = [2, 4, 3, 6, 5, 8, 7, 10]
    return base.map((b, i) => b + reportes.filter((r) => r.mes >= 6 + i).length % 3)
  }, [reportes])

  const porMes = useMemo(
    () => MESES.map((m) => ({
      ...m,
      total: reportes.filter((r) => r.mes === m.mes).length,
      resueltos: reportes.filter((r) => r.mes === m.mes && r.estado === 'resuelto').length,
    })),
    [reportes],
  )

  const kgPorZona = useMemo(
    () =>
      ZONAS.map((z) => ({
        id: z.id,
        nombre: z.nombre,
        corto: z.nombre.split(' – ')[0],
        total: reportes.filter((r) => r.zona === z.id).reduce((s, r) => s + (Number(r.kg) || 0), 0),
      })).sort((a, b) => b.total - a.total),
    [reportes],
  )

  const kgPorTipo = useMemo(
    () =>
      porTipo
        .filter((t) => t.total > 0)
        .map((t) => ({
          ...t,
          sufijo: ' kg',
          total: reportes.filter((r) => r.tipo === t.id).reduce((s, r) => s + (Number(r.kg) || 0), 0),
          icono: <IconoTipo tipo={t.id} size={15} />,
        }))
        .sort((a, b) => b.total - a.total),
    [reportes, porTipo],
  )

  const estadoPorZona = useMemo(
    () =>
      porZona
        .filter((z) => z.total > 0)
        .map((z) => {
          const del = reportes.filter((r) => r.zona === z.id)
          const porEstado = {}
          Object.keys(COLORES_ESTADO).forEach((e) => (porEstado[e] = del.filter((r) => r.estado === e).length))
          return { id: z.id, nombre: z.nombre.split(' – ')[0], total: del.length, porEstado }
        }),
    [reportes, porZona],
  )

  const estadoDonut = porEstado.map((e) => {
    const info = Object.values(ESTADOS).find((x) => x.id === e.estado)
    return {
      id: e.estado,
      nombre: info.nombre,
      total: e.total,
      color: COLORES_ESTADO[e.estado],
      icono: null,
    }
  })

  const tiposDonut = porTipo
    .filter((t) => t.total > 0)
    .map((t) => ({ ...t, icono: <IconoTipo tipo={t.id} size={14} /> }))

  const zonasConFoto = porZona.slice(0, 3)
  const promedioKg = total ? Math.round(kgTotal / total) : 0

  return (
    <PageWrapper>
      <div className="pagina-cabecera">
        <div className="contenedor">
          <span className="etiqueta"><BarChart3 size={14} /> RF-04 · Indicadores</span>
          <h1>Indicadores de gestión</h1>
          <p>
            Información consolidada para la toma de decisiones: zonas más afectadas, residuos predominantes,
            evolución por periodo, matrices de concentración y cronograma del proyecto.
          </p>
        </div>
      </div>

      <div className="contenedor pagina" style={{ paddingTop: 0 }}>
        {/* KPIs superiores con sparklines */}
        <div className="stats-grid mb-4">
          {[
            { icono: Activity, valor: total, sufijo: '', label: 'Reportes totales', serie: serieSemanal, color: '#16a34a' },
            { icono: Trash2, valor: kgTotal, sufijo: ' kg', label: 'Volumen estimado', serie: porMes.map((m) => m.total), color: '#f59e0b' },
            { icono: MapPinned, valor: porZona.filter((z) => z.total > 0).length, sufijo: '', label: 'Zonas con reportes', serie: porMes.map((m) => m.resueltos), color: '#0ea5e9' },
            { icono: TrendingUp, valor: promedioKg, sufijo: ' kg', label: 'Promedio por reporte', serie: serieSemanal.map((v, i) => v * (i + 1)), color: '#8b5cf6' },
          ].map((s, i) => (
            <motion.div key={s.label} className="stat-card" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }} custom={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-ico"><s.icono size={26} /></div>
                <Sparkline serie={s.serie} color={s.color} />
              </div>
              <div className="stat-valor"><Contador hasta={s.valor} sufijo={s.sufijo} /></div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Fila 1: zonas + dona */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 22 }} className="mb-3">
          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }}>
            <div className="flex-centro gap-1">
              <MapPinned size={18} className="verde" />
              <span className="grafica-titulo">Reportes por zona</span>
            </div>
            <p className="grafica-sub">Zonas marino-costeras más afectadas del departamento de Córdoba</p>
            <BarrasH datos={porZona} />
          </motion.div>

          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }} custom={1}>
            <div className="flex-centro gap-1">
              <PieChart size={18} className="verde" />
              <span className="grafica-titulo">Tipos de residuo</span>
            </div>
            <p className="grafica-sub">Distribución porcentual del residuo predominante reportado</p>
            <Dona datos={tiposDonut} />
          </motion.div>
        </div>

        {/* Fila 2: columnas kg + línea doble */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 22 }} className="mb-3">
          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }}>
            <div className="flex-centro gap-1">
              <BarChart3 size={18} className="verde" />
              <span className="grafica-titulo">Volumen (kg) por zona</span>
            </div>
            <p className="grafica-sub">Kilogramos acumulados estimados en cada zona monitoreada</p>
            <Columnas datos={kgPorZona} />
          </motion.div>

          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }} custom={1}>
            <div className="flex-centro gap-1">
              <GitCompareArrows size={18} className="verde" />
              <span className="grafica-titulo">Reportes vs. resueltos</span>
            </div>
            <p className="grafica-sub">Comparativa mensual entre lo reportado y lo gestionado</p>
            <div className="flex gap-3 envolver mb-2" style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--texto-suave)' }}>
              <span className="flex-centro gap-1"><i style={{ width: 14, height: 4, borderRadius: 9, background: '#0284c7', display: 'inline-block' }} /> Reportes</span>
              <span className="flex-centro gap-1"><i style={{ width: 14, height: 4, borderRadius: 9, background: '#16a34a', display: 'inline-block' }} /> Resueltos</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 460 }}>
                <LineaDoble datos={porMes} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Fila 3: evolución */}
        <motion.div className="grafica-caja mb-3" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }}>
          <div className="flex-centro gap-1">
            <TrendingUp size={18} className="verde" />
            <span className="grafica-titulo">Evolución de reportes por mes</span>
          </div>
          <p className="grafica-sub">Últimos meses del año {new Date().getFullYear()} · identificación de patrones y temporadas</p>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 480 }}>
              <LineaEvolucion datos={porMes} />
            </div>
          </div>
        </motion.div>

        {/* Fila 4: apiladas + matriz */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 22 }} className="mb-3">
          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }}>
            <div className="flex-centro gap-1">
              <Layers size={18} className="verde" />
              <span className="grafica-titulo">Estado por zona (barras apiladas)</span>
            </div>
            <p className="grafica-sub">Composición del flujo de gestión en cada zona</p>
            <Apiladas filas={estadoPorZona} />
          </motion.div>

          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }} custom={1}>
            <div className="flex-centro gap-1">
              <Grid3x3 size={18} className="verde" />
              <span className="grafica-titulo">Matriz de concentración</span>
            </div>
            <p className="grafica-sub">Frecuencia de reportes: zona × tipo de residuo</p>
            <MatrizCalor reportes={reportes} />
          </motion.div>
        </div>

        {/* Fila 5: estados + metas ODS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22 }} className="mb-3">
          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }}>
            <div className="flex-centro gap-1">
              <Activity size={18} className="verde" />
              <span className="grafica-titulo">Estado de los reportes</span>
            </div>
            <p className="grafica-sub">Avance del flujo de gestión: pendiente → verificado → jornada → resuelto</p>
            <div className="dona-envoltura">
              {estadoDonut.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.55 }}
                  style={{ textAlign: 'center', flex: '1 1 110px', background: 'var(--verde-50)', borderRadius: 16, padding: '16px 8px', border: '1px solid var(--linea)' }}
                >
                  <div style={{ fontFamily: 'var(--fuente-titulo)', fontWeight: 800, fontSize: '1.7rem', color: e.color }}>
                    <Contador hasta={e.total} duracion={1.1} />
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--texto-suave)' }}>{e.nombre}</div>
                </motion.div>
              ))}
            </div>
            <div className="mt-3" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <Anillo porcentaje={porcentajeResuelto} etiqueta="Reportes resueltos" color="#16a34a" tamano={130} />
              <Anillo porcentaje={porcentajeResuelto > 80 ? 92 : porcentajeResuelto + 8} etiqueta="Avance meta local 14.1" color="#0ea5e9" tamano={130} />
            </div>
          </motion.div>

          <motion.div
            className="grafica-caja"
            variants={subir}
            initial="oculto"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            style={{ background: 'linear-gradient(155deg, var(--verde-950), var(--verde-800))', border: 'none', color: 'white', position: 'relative', overflow: 'hidden' }}
          >
            <div className="textura-puntos" style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: 'radial-gradient(rgba(255,255,255,.22) 1.3px, transparent 1.3px)' }} />
            <div style={{ position: 'relative' }}>
              <div className="flex-centro gap-1">
                <Target size={18} style={{ color: 'var(--lima)' }} />
                <span className="grafica-titulo" style={{ color: 'white' }}>Top 3 zonas prioritarias</span>
              </div>
              <p className="grafica-sub" style={{ color: '#a7f3d0' }}>Recomendación para la próxima jornada de limpieza</p>

              {zonasConFoto.map((z, i) => (
                <motion.div
                  key={z.id}
                  initial={{ opacity: 0, x: -26 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + i * 0.14, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                    borderRadius: 15, padding: '15px 17px', marginBottom: 12,
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--fuente-titulo)', fontWeight: 800, fontSize: '1.5rem',
                    color: i === 0 ? 'var(--lima)' : 'rgba(255,255,255,.55)', width: 34,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{z.nombre}</div>
                    <div style={{ height: 7, background: 'rgba(255,255,255,.16)', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(z.total / (zonasConFoto[0].total || 1)) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.14, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--lima), var(--verde-400))', borderRadius: 99 }}
                      />
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--fuente-titulo)', fontWeight: 800, fontSize: '1.15rem' }}>{z.total}</span>
                </motion.div>
              ))}

              <div style={{ marginTop: 18, padding: '14px 16px', background: 'rgba(163,230,53,.14)', border: '1px dashed rgba(163,230,53,.45)', borderRadius: 14, fontSize: '0.85rem', color: '#d9f99d', display: 'flex', gap: 9 }}>
                <Lightbulb size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>Sugerencia:</strong> priorizar la zona <strong>{zonasConFoto[0]?.nombre}</strong> por su
                  alta frecuencia de reportes, coordinando con la autoridad ambiental local.
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Fila 6: volumen por tipo + cronograma */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 22 }} className="mb-3">
          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }}>
            <div className="flex-centro gap-1">
              <Trash2 size={18} className="verde" />
              <span className="grafica-titulo">Volumen (kg) por tipo de residuo</span>
            </div>
            <p className="grafica-sub">¿Qué residuo aporta más tonelaje a la problemática?</p>
            <BarrasH datos={kgPorTipo} />
          </motion.div>

          <motion.div className="grafica-caja" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }} custom={1}>
            <div className="flex-centro gap-1">
              <Timer size={18} className="verde" />
              <span className="grafica-titulo">Semáforo de metas (meta 14.1)</span>
            </div>
            <p className="grafica-sub">Cumplimiento del indicador local de contaminación costera</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Reducción de puntos críticos', valor: porcentajeResuelto, color: '#22c55e' },
                { label: 'Reportes verificados a tiempo', valor: Math.min(96, porcentajeResuelto + 18), color: '#0ea5e9' },
                { label: 'Cobertura de zonas monitoreadas', valor: 74, color: '#f59e0b' },
                { label: 'Participación ciudadana activa', valor: 58, color: '#f59e0b' },
              ].map((m, i) => (
                <div key={m.label}>
                  <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: 'var(--texto-suave)', marginBottom: 5 }}>
                    <span>{m.label}</span>
                    <span style={{ color: m.color }}>{m.valor}%</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--verde-100)', borderRadius: 999, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.valor}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.12, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', background: m.color, borderRadius: 999 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Cronograma Gantt */}
        <motion.div className="grafica-caja mb-3" variants={subir} initial="oculto" whileInView="visible" viewport={{ once: true }}>
          <div className="flex-centro gap-1">
            <CalendarRange size={18} className="verde" />
            <span className="grafica-titulo">Cronograma del anteproyecto</span>
          </div>
          <p className="grafica-sub">Planificación de actividades del proyecto de grado (5 meses)</p>
          <Cronograma />
        </motion.div>

        <p className="texto-centro texto-suave mt-4" style={{ fontSize: '0.8rem' }}>
          Indicadores calculados sobre la base de datos del prototipo · Alineado con la meta 14.1
          del ODS 14 (Agenda 2030)
        </p>
      </div>
    </PageWrapper>
  )
}
