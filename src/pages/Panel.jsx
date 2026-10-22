import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, Mail, Users, Paintbrush, Settings,
  CheckCircle2, ArrowRight, Trash2, Eye, MapPin, Calendar, Weight,
  ClipboardList as ClipboardIcon, AlertTriangle, Star, Download,
  RefreshCw, Send, Inbox, Lock, ShieldCheck, Power, FileJson, Globe, Save,
  ChevronDown, Filter,
} from 'lucide-react'
import PageWrapper from '../components/PageWrapper.jsx'
import Contador from '../components/Contador.jsx'
import IconoTipo, { COLOR_TIPO } from '../components/IconoTipo.jsx'
import { useReportes } from '../store/ReportesContext.jsx'
import { useAjustes } from '../store/AjustesContext.jsx'
import { useAuth } from '../store/AuthContext.jsx'
import { api, apiDisponible } from '../api.js'
import { ESTADOS, FLUJO_ESTADOS, ZONAS, TIPOS_RESIDUO } from '../data/mock.js'

const PESTANAS = [
  { id: 'resumen', nombre: 'Resumen', icono: LayoutDashboard },
  { id: 'reportes', nombre: 'Reportes', icono: ClipboardList },
  { id: 'correos', nombre: 'Correos', icono: Mail },
  { id: 'usuarios', nombre: 'Usuarios', icono: Users },
  { id: 'contenido', nombre: 'Contenido', icono: Paintbrush },
  { id: 'ajustes', nombre: 'Ajustes', icono: Settings },
]

export default function Panel() {
  const {
    reportes, cambiarEstado, actualizarReporte, eliminarReporte, restaurarReporte,
    total, kgTotal, porcentajeResuelto,
  } = useReportes()
  const { ajustes, guardar, refrescar } = useAjustes()
  const { usuario, salir } = useAuth()

  const [pestana, setPestana] = useState('resumen')
  const [filtro, setFiltro] = useState('todos')

  /* ---------- Correos ---------- */
  const [correos, setCorreos] = useState([])
  const [noLeidos, setNoLeidos] = useState(0)
  const [correoAbierto, setCorreoAbierto] = useState(null)
  const conApi = apiDisponible() !== false

  const traerCorreos = useCallback(async () => {
    if (!conApi) return
    try {
      const d = await api.emails()
      setCorreos(d.correos || [])
      setNoLeidos(d.noLeidos || 0)
    } catch { /* sin permisos */ }
  }, [conApi])

  useEffect(() => {
    traerCorreos()
    const t = setInterval(traerCorreos, 6000)
    return () => clearInterval(t)
  }, [traerCorreos])

  const abrirCorreo = async (c) => {
    setCorreoAbierto(correoAbierto === c.id ? null : c.id)
    if (!c.leido) {
      setCorreos((prev) => prev.map((x) => (x.id === c.id ? { ...x, leido: 1 } : x)))
      setNoLeidos((n) => Math.max(0, n - 1))
      try { await api.marcarEmail(c.id, 1) } catch { /* modo local */ }
    }
  }

  /* ---------- Usuarios ---------- */
  const [usuarios, setUsuarios] = useState([])
  const traerUsuarios = useCallback(async () => {
    if (!conApi) return
    try { setUsuarios(await api.usuarios()) } catch { /* permisos */ }
  }, [conApi])
  useEffect(() => { traerUsuarios() }, [traerUsuarios])

  const cambiarUsuario = async (id, cambios) => {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...cambios } : u)))
    try { await api.actualizarUsuario(id, cambios); traerUsuarios() } catch { /* permisos */ }
  }

  /* ---------- Reportes ---------- */
  const [eliminados, setEliminados] = useState([])
  const [expandido, setExpandido] = useState(null)
  const visibles = filtro === 'todos' ? reportes : reportes.filter((r) => r.estado === filtro)
  const pendientes = reportes.filter((r) => r.estado === 'pendiente').length
  const enJornada = reportes.filter((r) => r.estado === 'jornada').length

  const avanzarEstado = (r) => {
    const idx = FLUJO_ESTADOS.indexOf(r.estado)
    if (idx < FLUJO_ESTADOS.length - 1) cambiarEstado(r.id, FLUJO_ESTADOS[idx + 1])
  }
  const quitar = (r) => {
    setEliminados((prev) => [...prev, r])
    eliminarReporte(r.id)
  }
  const restaurar = async () => {
    for (const r of eliminados) await restaurarReporte(r)
    setEliminados([])
  }

  const exportarCSV = () => {
    const cab = ['codigo', 'tipo', 'zona', 'estado', 'kg', 'fecha', 'lat', 'lng', 'direccion', 'reportado_por', 'descripcion']
    const filas = reportes.map((r) =>
      [r.id, r.tipoInfo?.nombre || r.tipo, r.zonaInfo?.nombre || r.zona, r.estado, r.kg, r.fecha, r.lat, r.lng,
        (r.direccion || '').replace(/"/g, "'"), r.reportadoPor || '', (r.descripcion || '').replace(/"/g, "'")]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','),
    )
    descargar(`marea-verde-reportes-${new Date().toISOString().slice(0, 10)}.csv`, [cab.join(','), ...filas].join('\n'), 'text/csv')
  }

  const exportarJSON = () => {
    descargar('marea-verde-respaldo.json', JSON.stringify({ fecha: new Date().toISOString(), ajustes, reportes }, null, 2), 'application/json')
  }

  const recargarTodo = async () => {
    await Promise.all([traerCorreos(), traerUsuarios(), refrescar()])
  }

  return (
    <PageWrapper>
      <div className="pagina-cabecera">
        <div className="contenedor">
          <div className="flex-centro gap-2 envolver entrepuesto">
            <div>
              <span className="etiqueta"><ShieldCheck size={14} /> Control total del sistema y del sitio</span>
              <h1>Panel administrativo</h1>
              <p>
                Bienvenido, {usuario?.nombre}. Gestiona reportes, correos, usuarios, contenido y ajustes.
              </p>
            </div>
            <div className="flex gap-2 envolver">
              <button className="btn btn-fantasma" style={{ color: 'white' }} onClick={recargarTodo}>
                <RefreshCw size={16} /> Actualizar
              </button>
              <button className="btn btn-secundario" onClick={salir}>
                <Power size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="contenedor pagina" style={{ paddingTop: 0 }}>
        {/* Pestañas */}
        <div className="panel-pestanas" role="tablist">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={pestana === p.id}
              className={`panel-pestana ${pestana === p.id ? 'activa' : ''}`}
              onClick={() => setPestana(p.id)}
              type="button"
            >
              {pestana === p.id && (
                <motion.span layoutId="panel-pestana-activa" className="panel-pestana-fondo" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />
              )}
              <span className="panel-pestana-contenido">
                <p.icono size={16} /> {p.nombre}
                {p.id === 'correos' && noLeidos > 0 && <i className="panel-dot">{noLeidos}</i>}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={pestana}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ================= RESUMEN ================= */}
            {pestana === 'resumen' && (
              <>
                <div className="panel-grid">
                  {[
                    { icono: ClipboardIcon, valor: total, label: 'Total reportes', bg: '#dcfce7', fg: '#15803d' },
                    { icono: AlertTriangle, valor: pendientes, label: 'Pendientes por verificar', bg: '#fef3c7', fg: '#b45309' },
                    { icono: Eye, valor: enJornada, label: 'En jornada de limpieza', bg: '#ede9fe', fg: '#6d28d9' },
                    { icono: Mail, valor: noLeidos, label: 'Correos sin leer', bg: '#e0f2fe', fg: '#0369a1' },
                  ].map((k, i) => (
                    <motion.div
                      key={k.label}
                      className="tarjeta"
                      initial={{ opacity: 0, y: 26 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      style={{ display: 'flex', gap: 15, alignItems: 'center', padding: '20px 22px' }}
                    >
                      <span style={{ width: 50, height: 50, borderRadius: 14, background: k.bg, color: k.fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <k.icono size={24} />
                      </span>
                      <div>
                        <div className="stat-valor" style={{ fontSize: '1.75rem' }}>
                          <Contador hasta={k.valor} sufijo={k.sufijo || ''} duracion={1.2} />
                        </div>
                        <div className="stat-label" style={{ marginTop: 3 }}>{k.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }} className="mt-3">
                  {/* Volumen + tasa */}
                  <div className="tarjeta" style={{ padding: '24px' }}>
                    <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem' }}>
                      <Weight size={17} /> Gestionado
                    </h3>
                    <div className="stat-valor mt-2" style={{ fontSize: '2.4rem', color: 'var(--verde-600)' }}>
                      <Contador hasta={kgTotal} sufijo=" kg" />
                    </div>
                    <p className="texto-suave" style={{ fontSize: '0.86rem' }}>Volumen total acumulado de residuos reportados</p>
                    <div className="barra-progreso mt-3" style={{ height: 12, background: 'var(--verde-100)', borderRadius: 999, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${porcentajeResuelto}%` }}
                        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--verde-500), var(--verde-600))', borderRadius: 999 }}
                      />
                    </div>
                    <div className="flex-between mt-1" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--verde-700)' }}>
                      <span>Tasa de resolución</span>
                      <span>{porcentajeResuelto}%</span>
                    </div>
                  </div>

                  {/* Últimos reportes */}
                  <div className="tarjeta" style={{ padding: '24px' }}>
                    <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem' }}>
                      <ClipboardList size={17} /> Actividad reciente
                    </h3>
                    <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {reportes.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex-centro gap-2" style={{ fontSize: '0.85rem' }}>
                          <span className="mini-ico" style={{ background: `${COLOR_TIPO[r.tipo]}18`, color: COLOR_TIPO[r.tipo] }}>
                            <IconoTipo tipo={r.tipo} size={15} />
                          </span>
                          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <b>{r.id}</b> · {r.zonaInfo?.nombre}
                          </span>
                          <span className={`badge ${ESTADOS[r.estado].clase}`}>{ESTADOS[r.estado].nombre}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-secundario btn-sm mt-3" onClick={() => setPestana('reportes')} type="button">
                      Gestionar reportes <ArrowRight size={15} />
                    </button>
                  </div>

                  {/* Últimos correos */}
                  <div className="tarjeta" style={{ padding: '24px' }}>
                    <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem' }}>
                      <Inbox size={17} /> Bandeja reciente
                    </h3>
                    {!conApi ? (
                      <p className="texto-suave mt-2" style={{ fontSize: '0.87rem' }}>
                        Activa el servidor (<b>npm run dev</b>) para recibir los correos automáticos en tiempo real.
                      </p>
                    ) : correos.length === 0 ? (
                      <p className="texto-suave mt-2" style={{ fontSize: '0.87rem' }}>Sin correos todavía.</p>
                    ) : (
                      <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {correos.slice(0, 4).map((c) => (
                          <button key={c.id} onClick={() => { setPestana('correos'); setCorreoAbierto(c.id) }} type="button" style={{ textAlign: 'left', background: 'var(--verde-50)', border: '1px solid var(--verde-200)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                            <strong style={{ fontSize: '0.83rem', display: 'block', color: 'var(--verde-900)' }}>{c.asunto}</strong>
                            <span style={{ fontSize: '0.76rem', color: 'var(--texto-suave)' }}>{c.para} · {new Date(c.creado + 'Z').toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button className="btn btn-secundario btn-sm mt-3" onClick={() => setPestana('correos')} type="button">
                      Abrir bandeja <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ================= REPORTES ================= */}
            {pestana === 'reportes' && (
              <>
                <div className="flex gap-2 envolver entrepuesto mb-3">
                  <div className="flex gap-1 envolver">
                    <Filter size={15} style={{ alignSelf: 'center', color: 'var(--texto-suave)' }} />
                    {[{ id: 'todos', nombre: 'Todos' }, ...Object.values(ESTADOS)].map((e) => (
                      <button key={e.id} className={`chip ${filtro === e.id ? 'chip-activo' : ''}`} onClick={() => setFiltro(e.id)}>
                        {e.nombre}
                        <span style={{ opacity: 0.75, fontSize: '0.76rem' }}>
                          ({e.id === 'todos' ? total : reportes.filter((r) => r.estado === e.id).length})
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-secundario btn-sm" onClick={exportarCSV} type="button">
                    <Download size={15} /> Exportar CSV
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <AnimatePresence mode="popLayout">
                    {visibles.map((r, i) => {
                      const idx = FLUJO_ESTADOS.indexOf(r.estado)
                      const ultimo = idx === FLUJO_ESTADOS.length - 1
                      const siguiente = ESTADOS[FLUJO_ESTADOS[idx + 1]]
                      const abierto = expandido === r.id
                      return (
                        <motion.div
                          key={r.id}
                          layout
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -60, scale: 0.94 }}
                          transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                          className="fila-reporte"
                          style={{ flexWrap: 'wrap', borderLeft: r.destacado ? '4px solid var(--lima)' : undefined }}
                        >
                          <span className="fila-tipo" style={{ color: COLOR_TIPO[r.tipo], background: `${COLOR_TIPO[r.tipo]}1c` }}>
                            <IconoTipo tipo={r.tipo} size={18} />
                          </span>

                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div className="fila-titulo">
                              {r.tipoInfo?.nombre} · <span className="texto-suave" style={{ fontWeight: 600 }}>{r.id}</span>
                              {r.destacado && <Star size={13} fill="var(--lima)" color="var(--lima)" style={{ verticalAlign: -2, marginLeft: 5 }} />}
                            </div>
                            <div className="fila-meta">{r.descripcion.slice(0, 78)}{r.descripcion.length > 78 && '…'}</div>
                          </div>

                          <div className="fila-meta">
                            <MapPin size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                            {r.zonaInfo?.nombre}
                            <br />
                            <Calendar size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                            {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>

                          {/* Controles en línea */}
                          <div className="flex-centro gap-2 envolver">
                            <select
                              value={r.estado}
                              onChange={(e) => cambiarEstado(r.id, e.target.value)}
                              className="panel-select"
                              title="Cambiar estado"
                            >
                              {Object.values(ESTADOS).map((e) => (
                                <option key={e.id} value={e.id}>{e.nombre}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              className="panel-num"
                              value={r.kg}
                              min={0}
                              onChange={(e) => actualizarReporte(r.id, { kg: Number(e.target.value) })}
                              title="Kilogramos estimados"
                            />
                          </div>

                          <div className="fila-acciones">
                            {!ultimo && (
                              <motion.button
                                className="icono-btn"
                                title={`Marcar como "${siguiente.nombre}"`}
                                onClick={() => avanzarEstado(r)}
                                whileTap={{ scale: 0.85 }}
                                style={{ width: 'auto', padding: '0 13px', gap: 7, fontSize: '0.8rem', fontWeight: 700 }}
                              >
                                <CheckCircle2 size={15} /> {siguiente.nombre}
                                <ArrowRight size={13} />
                              </motion.button>
                            )}
                            <button
                              className="icono-btn"
                              title="Destacar / quitar destaque"
                              onClick={() => actualizarReporte(r.id, { destacado: r.destacado ? 0 : 1 })}
                            >
                              <Star size={15} fill={r.destacado ? 'var(--lima)' : 'none'} color={r.destacado ? 'var(--lima)' : undefined} />
                            </button>
                            <button className="icono-btn" title="Editar detalle" onClick={() => setExpandido(abierto ? null : r.id)}>
                              <ChevronDown size={16} style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} />
                            </button>
                            <button className="icono-btn peligro" title="Eliminar reporte" onClick={() => quitar(r)}>
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Editor expandido */}
                          <AnimatePresence>
                            {abierto && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ width: '100%', overflow: 'hidden' }}
                              >
                                <div className="panel-editor">
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
                                    <div className="campo" style={{ margin: 0 }}>
                                      <label>Zona</label>
                                      <select value={r.zona} onChange={(e) => actualizarReporte(r.id, { zona: e.target.value })}>
                                        {ZONAS.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                      </select>
                                    </div>
                                    <div className="campo" style={{ margin: 0 }}>
                                      <label>Tipo de residuo</label>
                                      <select value={r.tipo} onChange={(e) => actualizarReporte(r.id, { tipo: e.target.value })}>
                                        {TIPOS_RESIDUO.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                      </select>
                                    </div>
                                    <div className="campo" style={{ margin: 0 }}>
                                      <label>Dirección (geocodificación)</label>
                                      <input value={r.direccion || ''} onChange={(e) => actualizarReporte(r.id, { direccion: e.target.value })} placeholder="Sin dirección" />
                                    </div>
                                  </div>
                                  <div className="campo" style={{ margin: 0 }}>
                                    <label>Descripción del reporte</label>
                                    <textarea value={r.descripcion} onChange={(e) => actualizarReporte(r.id, { descripcion: e.target.value })} rows={2} />
                                  </div>
                                  <div className="campo" style={{ margin: 0 }}>
                                    <label>Notas del administrador (se guardan en la base de datos)</label>
                                    <textarea
                                      value={r.notasAdmin || ''}
                                      onChange={(e) => actualizarReporte(r.id, { notas_admin: e.target.value })}
                                      rows={2}
                                      placeholder="Ej: Verificado en campo el…"
                                    />
                                  </div>
                                  <div className="flex gap-2 envolver" style={{ alignItems: 'center', fontSize: '0.8rem', color: 'var(--texto-suave)', fontWeight: 600 }}>
                                    <span className="flex-centro gap-1"><MapPin size={13} /> {r.lat?.toFixed?.(5)}, {r.lng?.toFixed?.(5)}</span>
                                    <span className="flex-centro gap-1"><Calendar size={13} /> {r.fecha}</span>
                                    <span className="flex-centro gap-1"><Weight size={13} /> {r.kg} kg</span>
                                    <span className="flex-centro gap-1"><Users size={13} /> {r.reportadoPor}</span>
                                  </div>
                                  {r.foto && (
                                    <img src={r.foto} alt={`Evidencia ${r.id}`} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--linea)' }} />
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>

                {visibles.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tarjeta texto-centro" style={{ padding: '44px 20px' }}>
                    <CheckCircle2 size={38} style={{ margin: '0 auto 10px', color: 'var(--verde-500)' }} />
                    <strong style={{ fontSize: '1.05rem' }}>No hay reportes en este estado</strong>
                    <p className="texto-suave" style={{ fontSize: '0.9rem', marginTop: 6 }}>Buen trabajo del equipo.</p>
                  </motion.div>
                )}
              </>
            )}

            {/* ================= CORREOS ================= */}
            {pestana === 'correos' && (
              <>
                <div className="tarjeta mb-3" style={{ padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ width: 44, height: 44, borderRadius: 13, background: '#e0f2fe', color: '#0369a1', display: 'grid', placeItems: 'center' }}>
                    <Send size={20} />
                  </span>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <strong style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)' }}>
                      Bandeja de notificaciones · {ajustes.contacto_email}
                    </strong>
                    <p className="texto-suave" style={{ fontSize: '0.84rem', marginTop: 2 }}>
                      Cada reporte genera un correo <b>inmediato</b> a la coordinación. {noLeidos > 0 && <b style={{ color: '#0369a1' }}>{noLeidos} sin leer.</b>}
                    </p>
                  </div>
                  <span className="badge badge-verificado"><RefreshCw size={13} /> Refresco automático cada 6 s</span>
                </div>

                {!conApi ? (
                  <div className="tarjeta texto-centro" style={{ padding: '44px 20px' }}>
                    <Mail size={36} style={{ margin: '0 auto 10px', color: 'var(--verde-400)' }} />
                    <strong>Servidor no detectado</strong>
                    <p className="texto-suave" style={{ fontSize: '0.9rem', marginTop: 6 }}>
                      Ejecuta <code>npm run dev</code> para activar la base de datos y los correos automáticos.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    <AnimatePresence mode="popLayout">
                      {correos.map((c, i) => (
                        <motion.div
                          key={c.id}
                          layout
                          initial={{ opacity: 0, y: 22 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.4 }}
                          className="tarjeta"
                          style={{
                            padding: '16px 20px', cursor: 'pointer',
                            borderLeft: c.leido ? undefined : '4px solid #0284c7',
                            background: c.leido ? undefined : '#f0f9ff',
                          }}
                          onClick={() => abrirCorreo(c)}
                        >
                          <div className="flex-centro gap-2">
                            <span className="mini-ico" style={{ background: c.tipo === 'reporte' ? '#dcfce7' : '#e0f2fe', color: c.tipo === 'reporte' ? '#15803d' : '#0369a1' }}>
                              {c.tipo === 'reporte' ? <Inbox size={16} /> : <Mail size={16} />}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="fila-titulo" style={{ fontWeight: c.leido ? 600 : 800 }}>
                                {c.asunto}
                              </div>
                              <div className="fila-meta">
                                De: {c.de} → Para: {c.para}
                              </div>
                            </div>
                            <span className="texto-suave" style={{ fontSize: '0.76rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {new Date(c.creado + 'Z').toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!c.leido && <span className="badge badge-verificado">Nuevo</span>}
                          </div>
                          <AnimatePresence>
                            {correoAbierto === c.id && (
                              <motion.pre
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="correo-cuerpo"
                              >
{c.cuerpo}
                              </motion.pre>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {correos.length === 0 && (
                      <div className="tarjeta texto-centro" style={{ padding: '44px 20px' }}>
                        <Inbox size={36} style={{ margin: '0 auto 10px', color: 'var(--verde-400)' }} />
                        <strong>La bandeja está vacía</strong>
                        <p className="texto-suave" style={{ fontSize: '0.9rem', marginTop: 6 }}>Crea un reporte desde /reportar y llegará aquí al instante.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ================= USUARIOS ================= */}
            {pestana === 'usuarios' && (
              <>
                {!conApi ? (
                  <div className="tarjeta texto-centro" style={{ padding: '44px 20px' }}>
                    <Users size={36} style={{ margin: '0 auto 10px', color: 'var(--verde-400)' }} />
                    <strong>Gestión de usuarios requiere el servidor</strong>
                    <p className="texto-suave" style={{ fontSize: '0.9rem', marginTop: 6 }}>Ejecuta <code>npm run dev</code>.</p>
                  </div>
                ) : (
                  <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="panel-tabla">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Registro</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuarios.map((u, i) => (
                            <motion.tr
                              key={u.id}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.4 }}
                            >
                              <td>
                                <span className="flex-centro gap-2" style={{ fontWeight: 700, color: 'var(--verde-900)' }}>
                                  <span className="mini-ico" style={{ background: u.rol === 'admin' ? '#ede9fe' : '#dcfce7', color: u.rol === 'admin' ? '#6d28d9' : '#15803d' }}>
                                    {u.rol === 'admin' ? <ShieldCheck size={15} /> : <Users size={15} />}
                                  </span>
                                  {u.nombre}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                              <td>
                                <select
                                  className="panel-select"
                                  value={u.rol}
                                  onChange={(e) => cambiarUsuario(u.id, { rol: e.target.value })}
                                  disabled={u.id === usuario?.id}
                                >
                                  <option value="ciudadano">Ciudadano</option>
                                  <option value="admin">Administrador</option>
                                </select>
                              </td>
                              <td style={{ fontSize: '0.82rem', color: 'var(--texto-suave)' }}>
                                {u.creado ? new Date(u.creado + 'Z').toLocaleDateString('es-CO') : '—'}
                              </td>
                              <td>
                                <span className={`badge ${u.activo ? 'badge-resuelto' : 'badge-pendiente'}`}>
                                  {u.activo ? 'Activo' : 'Bloqueado'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="icono-btn"
                                  title={u.activo ? 'Bloquear usuario' : 'Activar usuario'}
                                  disabled={u.id === usuario?.id}
                                  onClick={() => cambiarUsuario(u.id, { activo: u.activo ? 0 : 1 })}
                                >
                                  {u.activo ? <Lock size={15} /> : <Power size={15} />}
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ================= CONTENIDO ================= */}
            {pestana === 'contenido' && <EditorContenido ajustes={ajustes} guardar={guardar} />}

            {/* ================= AJUSTES ================= */}
            {pestana === 'ajustes' && (
              <AjustesPanel ajustes={ajustes} guardar={guardar} exportarJSON={exportarJSON} conApi={conApi} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Toast de eliminación */}
        <AnimatePresence>
          {eliminados.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--verde-950)', color: 'white', padding: '13px 22px',
                borderRadius: 999, boxShadow: 'var(--sombra-lg)', display: 'flex', gap: 14,
                alignItems: 'center', zIndex: 1100, fontSize: '0.88rem', fontWeight: 600,
              }}
            >
              <span>{eliminados.length} reporte{eliminados.length > 1 ? 's' : ''} eliminado{eliminados.length > 1 ? 's' : ''}</span>
              <button
                onClick={restaurar}
                style={{ background: 'var(--verde-500)', color: 'white', border: 'none', padding: '7px 16px', borderRadius: 999, fontWeight: 700, fontSize: '0.82rem' }}
              >
                Deshacer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}

/* ============================================================
   Editor de contenido del sitio (hero, secciones, colores)
   ============================================================ */
function EditorContenido({ ajustes, guardar }) {
  const [form, setForm] = useState(ajustes)
  const [guardado, setGuardado] = useState(false)
  useEffect(() => setForm(ajustes), [ajustes])
  const cambiar = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const secciones = [
    { id: 'problema', nombre: 'Sección «El problema»' },
    { id: 'como', nombre: 'Sección «Cómo funciona»' },
    { id: 'modulos', nombre: 'Sección «Módulos del sistema»' },
    { id: 'requisitos', nombre: 'Sección «Requisitos funcionales»' },
    { id: 'cta', nombre: 'Llamado a la acción final' },
  ]

  const alternarSeccion = (id) => {
    const actual = (form.secciones_visibles || '').split(',').filter(Boolean)
    const nueva = actual.includes(id) ? actual.filter((s) => s !== id) : [...actual, id]
    setForm((f) => ({ ...f, secciones_visibles: nueva.join(',') }))
  }

  const aplicar = async (parcial) => {
    setForm((f) => ({ ...f, ...parcial }))
    await guardar(parcional) // aplica en vivo en la página de inicio
  }

  const enviar = async (e) => {
    e.preventDefault()
    await guardar(form)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2400)
  }

  return (
    <form onSubmit={enviar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
      <div className="tarjeta" style={{ padding: '26px' }}>
        <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem', marginBottom: 18 }}>
          <Globe size={17} /> Textos principales
        </h3>
        <div className="campo"><label>Nombre del sitio</label><input value={form.nombre_sitio || ''} onChange={cambiar('nombre_sitio')} /></div>
        <div className="campo"><label>Título del hero (usa «,» para la parte con degradado)</label><input value={form.hero_titulo || ''} onChange={cambiar('hero_titulo')} /></div>
        <div className="campo"><label>Subtítulo del hero</label><textarea rows={3} value={form.hero_subtitulo || ''} onChange={cambiar('hero_subtitulo')} /></div>
        <div className="campo"><label>Título del llamado final</label><input value={form.cta_titulo || ''} onChange={cambiar('cta_titulo')} /></div>
        <div className="campo"><label>Texto del llamado final</label><textarea rows={3} value={form.cta_texto || ''} onChange={cambiar('cta_texto')} /></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="tarjeta" style={{ padding: '26px' }}>
          <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem', marginBottom: 14 }}>
            <Paintbrush size={17} /> Apariencia (se aplica en vivo)
          </h3>
          <div className="flex gap-3 envolver">
            <label className="flex-centro gap-2" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--texto-suave)' }}>
              Color principal
              <input type="color" value={form.tema_primario || '#15803d'} onChange={(e) => aplicar({ tema_primario: e.target.value })} style={{ width: 46, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
            </label>
            <label className="flex-centro gap-2" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--texto-suave)' }}>
              Color de acento
              <input type="color" value={form.tema_acento || '#a3e635'} onChange={(e) => aplicar({ tema_acento: e.target.value })} style={{ width: 46, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
            </label>
          </div>

          <div className="mt-3">
            <label className="flex-centro gap-2" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--texto-suave)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.banner_activo === '1'} onChange={(e) => aplicar({ banner_activo: e.target.checked ? '1' : '0' })} />
              Mostrar banner de aviso en la página
            </label>
            {form.banner_activo === '1' && (
              <div className="campo mt-2"><label>Texto del banner</label><input value={form.banner_texto || ''} onChange={cambiar('banner_texto')} /></div>
            )}
          </div>
        </div>

        <div className="tarjeta" style={{ padding: '26px' }}>
          <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem', marginBottom: 14 }}>
            <Eye size={17} /> Secciones visibles en el inicio
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {secciones.map((s) => (
              <label key={s.id} className="flex-centro gap-2" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--texto-suave)', cursor: 'pointer' }}>
                <input type="checkbox" checked={(form.secciones_visibles || '').includes(s.id)} onChange={() => alternarSeccion(s.id)} />
                {s.nombre}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-primario" type="submit">
          <Save size={17} /> Guardar contenido
        </button>
        <AnimatePresence>
          {guardado && (
            <motion.span initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-centro gap-1" style={{ color: 'var(--verde-600)', fontWeight: 700, fontSize: '0.88rem' }}>
              <CheckCircle2 size={16} /> Contenido guardado en la base de datos
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}

/* ============================================================
   Ajustes generales: contacto, alertas, mantenimiento, datos
   ============================================================ */
function AjustesPanel({ ajustes, guardar, exportarJSON, conApi }) {
  const [form, setForm] = useState(ajustes)
  const [guardado, setGuardado] = useState(false)
  useEffect(() => setForm(ajustes), [ajustes])
  const cambiar = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const enviar = async (e) => {
    e.preventDefault()
    await guardar(form)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2400)
  }

  return (
    <form onSubmit={enviar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
      <div className="tarjeta" style={{ padding: '26px' }}>
        <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem', marginBottom: 18 }}>
          <Mail size={17} /> Correo y contacto
        </h3>
        <div className="campo"><label>Correo de contacto (recibe los reportes)</label><input type="email" value={form.contacto_email || ''} onChange={cambiar('contacto_email')} /></div>
        <div className="campo"><label>Teléfono de contacto</label><input value={form.contacto_telefono || ''} onChange={cambiar('contacto_telefono')} /></div>
        <p className="campo-ayuda">
          El envío real requiere credenciales SMTP: en esta fase el correo se registra en la bandeja
          del panel (base de datos <b>emails</b>) de forma inmediata.
        </p>
      </div>

      <div className="tarjeta" style={{ padding: '26px' }}>
        <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem', marginBottom: 18 }}>
          <Settings size={17} /> Operación
        </h3>
        <div className="campo">
          <label>Umbral de alerta por reporte (kg)</label>
          <input type="number" min={10} value={form.umbral_alerta_kg || 150} onChange={cambiar('umbral_alerta_kg')} />
        </div>
        <label className="flex-centro gap-2 mt-2" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--texto-suave)', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.mantenimiento === '1'} onChange={(e) => guardar({ mantenimiento: e.target.checked ? '1' : '0' })} />
          Modo mantenimiento (aviso visible en el inicio)
        </label>
        <div className="campo mt-3">
          <label>Base de datos</label>
          <p className="campo-ayuda" style={{ margin: 0 }}>
            {conApi
              ? 'SQLite activo en server/data/marea.db — reportes, usuarios, correos y ajustes.'
              : 'Servidor apagado: los datos se guardan solo en el navegador.'}
          </p>
        </div>
      </div>

      <div className="tarjeta" style={{ padding: '26px' }}>
        <h3 className="flex-centro gap-2" style={{ fontFamily: 'var(--fuente-titulo)', color: 'var(--verde-900)', fontSize: '1.05rem', marginBottom: 18 }}>
          <FileJson size={17} /> Datos y respaldos
        </h3>
        <div className="flex gap-2 envolver">
          <button className="btn btn-secundario btn-sm" type="button" onClick={exportarJSON}>
            <Download size={15} /> Exportar JSON
          </button>
          <button className="btn btn-secundario btn-sm" type="button" onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Recargar datos
          </button>
        </div>
        <p className="campo-ayuda mt-2">
          El repositorio Git del proyecto y la base de datos viven en la misma carpeta del proyecto;
          <code> server/data/</code> se ignora en Git para no subir datos personales.
        </p>
      </div>

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-primario" type="submit"><Save size={17} /> Guardar ajustes</button>
        <AnimatePresence>
          {guardado && (
            <motion.span initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-centro gap-1" style={{ color: 'var(--verde-600)', fontWeight: 700, fontSize: '0.88rem' }}>
              <CheckCircle2 size={16} /> Ajustes guardados
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}

function descargar(nombre, contenido, mime) {
  const blob = new Blob([contenido], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}
