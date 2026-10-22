import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, LocateFixed, Calendar, Weight, ArrowDownUp, MapPin,
  MapPinned, Layers, Image as ImageIcon,
} from 'lucide-react'
import PageWrapper from '../components/PageWrapper.jsx'
import MapaGL from '../components/MapaGL.jsx'
import IconoTipo, { COLOR_TIPO } from '../components/IconoTipo.jsx'
import { useReportes } from '../store/ReportesContext.jsx'
import { ESTADOS, TIPOS_RESIDUO, ZONAS } from '../data/mock.js'

export default function Mapa() {
  const { reportes } = useReportes()
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [zonaSel, setZonaSel] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)

  const filtrados = useMemo(() => {
    return reportes.filter((r) => {
      const okEstado = filtroEstado === 'todos' || r.estado === filtroEstado
      const okTipo = filtroTipo === 'todos' || r.tipo === filtroTipo
      const okZona = !zonaSel || r.zona === zonaSel
      const t = busqueda.trim().toLowerCase()
      const okBusqueda =
        !t ||
        r.id.toLowerCase().includes(t) ||
        (r.zonaInfo?.nombre || '').toLowerCase().includes(t) ||
        (r.tipoInfo?.nombre || '').toLowerCase().includes(t)
      return okEstado && okTipo && okZona && okBusqueda
    })
  }, [reportes, filtroEstado, filtroTipo, zonaSel, busqueda])

  const chipsEstado = [{ id: 'todos', nombre: 'Todos' }, ...Object.values(ESTADOS)]

  return (
    <PageWrapper>
      <div className="pagina-cabecera">
        <div className="contenedor">
          <span className="etiqueta"><MapPinned size={14} /> RF-02 · Visualización geográfica real</span>
          <h1>Mapa de reportes 2D y 3D</h1>
          <p>
            Cartografía real con relieve tridimensional, mapa de calor de concentración y selección de
            la zona afectada. Filtra por estado, tipo o zona y haz clic en un pin para ver la evidencia.
          </p>
        </div>
      </div>

      <div className="contenedor pagina" style={{ paddingTop: 0 }}>
        {/* Barra de filtros */}
        <motion.div
          className="tarjeta mb-3"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ padding: '20px 22px' }}
        >
          <div className="flex gap-2 envolver entrepuesto">
            <div className="flex gap-1 envolver">
              {chipsEstado.map((e) => (
                <button
                  key={e.id}
                  className={`chip ${filtroEstado === e.id ? 'chip-activo' : ''}`}
                  onClick={() => setFiltroEstado(e.id)}
                >
                  {e.nombre}
                </button>
              ))}
            </div>

            <div className="flex gap-2 envolver">
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-suave)' }} />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar zona o código…"
                  style={{ padding: '10px 14px 10px 38px', border: '2px solid var(--linea)', borderRadius: 999, outline: 'none', fontSize: '0.9rem', width: 200, background: 'white' }}
                />
              </div>
              <select
                value={zonaSel}
                onChange={(e) => setZonaSel(e.target.value)}
                style={{ padding: '10px 14px', border: '2px solid var(--linea)', borderRadius: 999, outline: 'none', fontSize: '0.9rem', background: 'white', fontWeight: 600, color: 'var(--texto-suave)' }}
                title="Elegir la zona afectada"
              >
                <option value="">Todas las zonas</option>
                {ZONAS.map((z) => (
                  <option key={z.id} value={z.id}>{z.nombre}</option>
                ))}
              </select>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                style={{ padding: '10px 14px', border: '2px solid var(--linea)', borderRadius: 999, outline: 'none', fontSize: '0.9rem', background: 'white', fontWeight: 600, color: 'var(--texto-suave)' }}
              >
                <option value="todos">Todos los tipos</option>
                {TIPOS_RESIDUO.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 22 }} className="mapa-layout">
          {/* Mapa real 2D/3D */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <MapaGL
              reportes={filtrados}
              idSeleccionado={seleccionado}
              onSeleccionar={setSeleccionado}
              zonaResaltada={zonaSel || null}
            />
            <div className="flex gap-2 envolver mt-2" style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', fontWeight: 600 }}>
              <span className="flex-centro gap-1"><i style={{ width: 11, height: 11, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} /> Pendiente</span>
              <span className="flex-centro gap-1"><i style={{ width: 11, height: 11, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} /> Verificado</span>
              <span className="flex-centro gap-1"><i style={{ width: 11, height: 11, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} /> En jornada</span>
              <span className="flex-centro gap-1"><i style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--verde-600)', display: 'inline-block' }} /> Resuelto</span>
              <span className="flex-centro gap-1"><Layers size={13} /> Botón 2D/3D para ver el relieve</span>
            </div>
          </motion.div>

          {/* Lista lateral */}
          <div style={{ maxHeight: 590, overflowY: 'auto', paddingRight: 4 }}>
            <div className="flex-centro gap-1 entrepuesto mb-2" style={{ padding: '0 4px' }}>
              <strong style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)' }}>
                {filtrados.length} reporte{filtrados.length !== 1 && 's'}
              </strong>
              <span className="texto-suave" style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <ArrowDownUp size={13} /> Más recientes
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              {filtrados.map((r, i) => (
                <motion.article
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: 26 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 26, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="tarjeta tarjeta-hover"
                  onClick={() => setSeleccionado(r.id)}
                  style={{
                    padding: '15px 17px',
                    marginBottom: 12,
                    cursor: 'pointer',
                    borderLeft: seleccionado === r.id ? '4px solid var(--verde-500)' : undefined,
                  }}
                >
                  <div className="flex-centro gap-2">
                    <span
                      className="fila-tipo"
                      style={{ color: COLOR_TIPO[r.tipo], background: `${COLOR_TIPO[r.tipo]}1c` }}
                    >
                      <IconoTipo tipo={r.tipo} size={17} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fila-titulo">{r.tipoInfo?.nombre} · {r.id}</div>
                      <div className="fila-meta" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={12} /> {r.zonaInfo?.nombre}
                      </div>
                    </div>
                    <span className={`badge ${ESTADOS[r.estado].clase}`}>{ESTADOS[r.estado].nombre}</span>
                  </div>
                  <p className="texto-suave" style={{ fontSize: '0.83rem', marginTop: 9, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.descripcion}
                  </p>
                  <div className="flex gap-2 mt-2" style={{ fontSize: '0.76rem', color: 'var(--texto-suave)', fontWeight: 600 }}>
                    <span className="flex-centro gap-1"><Calendar size={12} /> {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
                    <span className="flex-centro gap-1"><Weight size={12} /> {r.kg} kg</span>
                    {r.foto && <span className="flex-centro gap-1"><ImageIcon size={12} /> Evidencia</span>}
                    <span className="flex-centro gap-1" style={{ marginLeft: 'auto', color: 'var(--verde-600)' }}><LocateFixed size={12} /> Ver en mapa</span>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>

            {filtrados.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tarjeta texto-centro" style={{ padding: '36px 20px' }}>
                <MapPinned size={34} style={{ margin: '0 auto 10px', color: 'var(--verde-400)' }} />
                <strong>No hay reportes con esos filtros</strong>
                <p className="texto-suave" style={{ fontSize: '0.88rem', marginTop: 6 }}>Prueba con otra zona o tipo de residuo.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 940px) {
          .mapa-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PageWrapper>
  )
}
