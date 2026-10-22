import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MapPin, Camera, ClipboardCheck, ChevronLeft, ChevronRight, Check,
  Crosshair, ImagePlus, X, Send, Trash2, Mail, MapPinned, User, Weight, Tag,
} from 'lucide-react'
import PageWrapper from '../components/PageWrapper.jsx'
import MapaGL from '../components/MapaGL.jsx'
import IconoTipo, { COLOR_TIPO } from '../components/IconoTipo.jsx'
import { useReportes } from '../store/ReportesContext.jsx'
import { useAjustes } from '../store/AjustesContext.jsx'
import { useAuth } from '../store/AuthContext.jsx'
import { TIPOS_RESIDUO, ZONAS } from '../data/mock.js'

const PASOS = [
  { n: 1, icono: MapPin, texto: 'Ubicación' },
  { n: 2, icono: ClipboardCheck, texto: 'Residuo' },
  { n: 3, icono: Camera, texto: 'Evidencia' },
]

const pasoAnim = {
  entrada: { opacity: 0, x: 46, scale: 0.98 },
  visible: { opacity: 1, x: 0, scale: 1 },
  salida: { opacity: 0, x: -46, scale: 0.98 },
}

/** Reduce la foto a un JPEG compacto antes de enviarla */
function compactarImagen(file, maxSize = 1000) {
  return new Promise((resolve) => {
    const lector = new FileReader()
    lector.onload = () => {
      const img = new Image()
      img.onload = () => {
        const escala = Math.min(1, maxSize / Math.max(img.width, img.height))
        const lienzo = document.createElement('canvas')
        lienzo.width = Math.round(img.width * escala)
        lienzo.height = Math.round(img.height * escala)
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
        resolve(lienzo.toDataURL('image/jpeg', 0.72))
      }
      img.onerror = () => resolve(lector.result)
      img.src = lector.result
    }
    lector.readAsDataURL(file)
  })
}

export default function Reportar() {
  const { crearReporte, reportes } = useReportes()
  const { ajustes } = useAjustes()
  const { usuario } = useAuth()

  const [paso, setPaso] = useState(1)
  const [coords, setCoords] = useState(null)
  const [direccion, setDireccion] = useState('')
  const [zona, setZona] = useState('')
  const [tipo, setTipo] = useState(null)
  const [kg, setKg] = useState(50)
  const [descripcion, setDescripcion] = useState('')
  const [nombre, setNombre] = useState('')
  const [foto, setFoto] = useState(null)
  const [creado, setCreado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const geoRef = useRef(null)

  /* Geocodificación inversa real (Nominatim · OpenStreetMap) al marcar el punto */
  useEffect(() => {
    if (!coords) return
    let cancelado = false
    setDireccion('')
    const t = setTimeout(async () => {
      try {
        const ctrl = new AbortController()
        geoRef.current = ctrl
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}&zoom=16&addressdetails=1&accept-language=es`,
          { signal: ctrl.signal, headers: { Accept: 'application/json' } },
        )
        const j = await r.json()
        if (cancelado) return
        const d = j.address || {}
        const partes = [d.road, d.suburb || d.village || d.town || d.city_district, d.city || d.town || d.municipality]
          .filter(Boolean)
        setDireccion(partes.length ? partes.join(', ') : j.display_name?.slice(0, 120) || '')
      } catch {
        if (!cancelado) setDireccion('')
      }
    }, 500)
    return () => {
      cancelado = true
      clearTimeout(t)
      geoRef.current?.abort()
    }
  }, [coords])

  const ubicacionOk = coords !== null
  const residuoOk = tipo !== null
  const evidenciaOk = descripcion.trim().length >= 10
  const puedeAvanzar = paso === 1 ? ubicacionOk : paso === 2 ? residuoOk : evidenciaOk

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización. Selecciona el punto en el mapa.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude])
        const cercana = ZONAS.reduce((best, z) => {
          const d = Math.hypot(z.lat - pos.coords.latitude, z.lng - pos.coords.longitude)
          return d < best.d ? { z, d } : best
        }, { z: ZONAS[0], d: Infinity })
        setZona(cercana.z.id)
      },
      () => {
        alert('No fue posible obtener tu ubicación. Selecciona el punto en el mapa.')
      },
      { enableHighAccuracy: true, timeout: 6000 },
    )
  }

  const seleccionarZona = (id) => {
    setZona(id)
    const z = ZONAS.find((x) => x.id === id)
    if (z) setCoords([z.lat, z.lng])
  }

  const onFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(await compactarImagen(file))
  }

  const enviar = async () => {
    setEnviando(true)
    setErrorEnvio('')
    try {
      const { reporte } = await crearReporte({
        tipo,
        zona: zona || 'monteria',
        lat: coords[0],
        lng: coords[1],
        kg,
        descripcion: descripcion.trim(),
        direccion,
        foto,
        reportadoPor: nombre.trim() || usuario?.nombre || 'Ciudadanía',
      })
      setCreado(reporte)
    } catch (err) {
      setErrorEnvio(err.message || 'No fue posible enviar el reporte')
    } finally {
      setEnviando(false)
    }
  }

  const reiniciar = () => {
    setCreado(null); setPaso(1); setCoords(null); setDireccion(''); setZona(''); setTipo(null)
    setKg(50); setDescripcion(''); setNombre(''); setFoto(null); setErrorEnvio('')
  }

  /* ---------- Pantalla de éxito ---------- */
  if (creado) {
    return (
      <PageWrapper>
        <div className="pagina">
          <div className="contenedor">
            <motion.div className="exito-caja" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="exito-ico">
                <Check size={56} strokeWidth={3.4} />
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', color: 'var(--verde-900)' }}
              >
                ¡Reporte enviado!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="texto-suave"
                style={{ maxWidth: 500, margin: '14px auto 0', fontSize: '1.04rem' }}
              >
                Tu aporte se registró con el código <strong style={{ color: 'var(--verde-700)' }}>{creado.id}</strong> y
                quedó en estado <em>Pendiente</em> para verificación. Gracias por cuidar la costa.
              </motion.p>

              {/* Correo inmediato (simulado) */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  maxWidth: 480, margin: '26px auto 0', textAlign: 'left',
                  background: 'var(--verde-50)', border: '1px solid var(--verde-200)',
                  borderRadius: 'var(--radio-md)', padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start',
                }}
              >
                <motion.span
                  initial={{ rotate: -14, scale: 0.7 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 16 }}
                  style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--verde-600)', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0 }}
                >
                  <Mail size={21} />
                </motion.span>
                <div>
                  <strong style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '0.92rem', color: 'var(--verde-900)' }}>
                    Correo enviado de inmediato
                  </strong>
                  <p style={{ fontSize: '0.86rem', color: 'var(--texto-suave)', marginTop: 4, lineHeight: 1.55 }}>
                    Se notificó a <b style={{ color: 'var(--verde-700)' }}>{ajustes.contacto_email}</b> con el asunto
                    «Nuevo reporte {creado.id}». Puedes verlo en Panel → Bandeja de correos.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex gap-2 envolver mt-4"
                style={{ justifyContent: 'center' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <Link to="/mapa" className="btn btn-primario">
                  <MapPin size={17} /> Verlo en el mapa
                </Link>
                <button className="btn btn-secundario" onClick={reiniciar}>
                  <Send size={16} /> Hacer otro reporte
                </button>
              </motion.div>

              <motion.div
                className="tarjeta mt-4"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                style={{ maxWidth: 480, margin: '36px auto 0', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center' }}
              >
                <span className="fila-tipo" style={{ width: 54, height: 54, color: COLOR_TIPO[creado.tipo], background: `${COLOR_TIPO[creado.tipo]}1c` }}>
                  <IconoTipo tipo={creado.tipo} size={24} />
                </span>
                <div>
                  <div className="fila-titulo">{TIPOS_RESIDUO.find((t) => t.id === creado.tipo)?.nombre} · {creado.kg} kg</div>
                  <div className="fila-meta">{ZONAS.find((z) => z.id === creado.zona)?.nombre}</div>
                </div>
                <span className="badge badge-pendiente" style={{ marginLeft: 'auto' }}>Pendiente</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </PageWrapper>
    )
  }

  /* ---------- Asistente ---------- */
  return (
    <PageWrapper>
      <div className="pagina-cabecera">
        <div className="contenedor">
          <span className="etiqueta"><Camera size={14} /> RF-01 · Reporte ciudadano</span>
          <h1>Registrar un reporte</h1>
          <p>
            Marca el punto en el mapa real (2D o 3D), clasifica el tipo de residuo y adjunta la
            evidencia. El reporte entrará en estado <strong style={{ color: 'white' }}>Pendiente</strong> y
            se notificará por correo de inmediato.
          </p>
        </div>
      </div>

      <div className="contenedor pagina" style={{ paddingTop: 0 }}>
        <div className="tarjeta" style={{ maxWidth: 880, margin: '0 auto', padding: '34px clamp(20px, 4vw, 44px)' }}>
          {/* Progreso */}
          <div className="progreso-pasos">
            {PASOS.map((p, i) => {
              const estado = paso === p.n ? 'activo' : paso > p.n ? 'completado' : ''
              return (
                <div key={p.n} className={`paso ${estado}`}>
                  <div className="paso-bola">{paso > p.n ? <Check size={19} strokeWidth={3} /> : p.n}</div>
                  <span className="paso-texto">{p.texto}</span>
                  {i < PASOS.length - 1 && (
                    <div className="paso-linea">
                      <motion.div
                        className="paso-linea-relleno"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: paso > p.n ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* ============ PASO 1: UBICACIÓN ============ */}
            {paso === 1 && (
              <motion.div key="p1" variants={pasoAnim} initial="entrada" animate="visible" exit="salida" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <div className="flex-centro gap-2 envolver entrepuesto mb-2">
                  <div>
                    <h2 style={{ fontSize: '1.3rem', color: 'var(--verde-900)' }}>¿Dónde está el punto crítico?</h2>
                    <p className="texto-suave" style={{ fontSize: '0.92rem' }}>
                      Elige la zona afectada o haz clic en el mapa para marcar la ubicación exacta.
                    </p>
                  </div>
                  <button className="btn btn-secundario btn-sm" onClick={usarMiUbicacion}>
                    <Crosshair size={16} /> Usar mi ubicación
                  </button>
                </div>

                {/* Selector de zona afectada (resalta y centra el mapa) */}
                <div className="campo mb-2">
                  <label><MapPinned size={14} /> Zona afectada</label>
                  <select value={zona} onChange={(e) => seleccionarZona(e.target.value)}>
                    <option value="">— Elegir zona en el mapa —</option>
                    {ZONAS.map((z) => (
                      <option key={z.id} value={z.id}>{z.nombre}</option>
                    ))}
                  </select>
                </div>

                <MapaGL
                  alto="mapa-altura-sm"
                  reportes={reportes.slice(0, 8)}
                  seleccionable
                  onClicMapa={(c) => setCoords(c)}
                  marcadorSeleccion={coords}
                  zonaResaltada={zona || null}
                />

                <div className="flex-centro gap-2 mt-2 envolver" style={{ fontSize: '0.87rem', fontWeight: 600 }}>
                  {coords ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-centro gap-1"
                      style={{ color: 'var(--verde-700)', background: 'var(--verde-100)', padding: '8px 15px', borderRadius: 999 }}
                    >
                      <MapPin size={15} /> {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
                      {direccion && (
                        <span style={{ fontWeight: 500, color: 'var(--texto-suave)' }}>· {direccion}</span>
                      )}
                    </motion.span>
                  ) : (
                    <span className="texto-suave flex-centro gap-1"><MapPin size={15} /> Aún no has marcado el punto</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* ============ PASO 2: RESIDUO ============ */}
            {paso === 2 && (
              <motion.div key="p2" variants={pasoAnim} initial="entrada" animate="visible" exit="salida" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h2 style={{ fontSize: '1.3rem', color: 'var(--verde-900)' }}>¿Qué tipo de residuos ves?</h2>
                <p className="texto-suave mb-3" style={{ fontSize: '0.92rem' }}>Selecciona el predominante.</p>

                <div className="tipos-grid">
                  {TIPOS_RESIDUO.map((t, i) => (
                    <motion.button
                      key={t.id}
                      className={`tipo-opcion ${tipo === t.id ? 'elegido' : ''}`}
                      onClick={() => setTipo(t.id)}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      whileTap={{ scale: 0.94 }}
                      type="button"
                    >
                      <span className="emoji" style={{ color: COLOR_TIPO[t.id], background: `${COLOR_TIPO[t.id]}18` }}>
                        <IconoTipo tipo={t.id} size={24} />
                      </span>
                      {t.nombre}
                      {tipo === t.id && (
                        <motion.span
                          layoutId="check-tipo"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            position: 'absolute', top: 7, right: 7, width: 22, height: 22,
                            borderRadius: '50%', background: 'var(--verde-500)', color: 'white',
                            display: 'grid', placeItems: 'center',
                          }}
                        >
                          <Check size={13} strokeWidth={3.4} />
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="campo mt-4 rango-envoltura">
                  <label><Weight size={14} /> Volumen estimado</label>
                  <div className="rango-valor">{kg} kg</div>
                  <input type="range" min="5" max="300" step="5" value={kg} onChange={(e) => setKg(Number(e.target.value))} />
                  <div className="campo-ayuda" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>5 kg</span><span>300 kg</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============ PASO 3: EVIDENCIA ============ */}
            {paso === 3 && (
              <motion.div key="p3" variants={pasoAnim} initial="entrada" animate="visible" exit="salida" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h2 style={{ fontSize: '1.3rem', color: 'var(--verde-900)' }}>Evidencia y descripción</h2>
                <p className="texto-suave mb-3" style={{ fontSize: '0.92rem' }}>
                  La foto es opcional, la descripción es necesaria (mínimo 10 caracteres).
                </p>

                {foto ? (
                  <div className="foto-preview mb-3">
                    <img src={foto} alt="Evidencia del reporte" />
                    <button className="foto-quitar" onClick={() => setFoto(null)} type="button" aria-label="Quitar foto">
                      <X size={17} />
                    </button>
                  </div>
                ) : (
                  <label className="zona-foto mb-3">
                    <input type="file" accept="image/*" onChange={onFoto} />
                    <ImagePlus size={34} style={{ marginInline: 'auto', marginBottom: 8 }} />
                    <strong style={{ display: 'block' }}>Selecciona una foto de evidencia</strong>
                    <span style={{ fontSize: '0.82rem' }}>JPG o PNG · se comprime automáticamente</span>
                  </label>
                )}

                <div className="campo">
                  <label>Descripción del hallazgo *</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Acumulación de botellas y bolsas plásticas arrastradas por la marea sobre la franja arenosa…"
                    maxLength={400}
                  />
                  <span className="campo-ayuda" style={{ textAlign: 'right', color: descripcion.trim().length >= 10 ? 'var(--verde-600)' : undefined }}>
                    {descripcion.trim().length}/400 {descripcion.trim().length < 10 && '· mínimo 10 caracteres'}
                  </span>
                </div>

                <div className="campo">
                  <label><User size={14} /> Tu nombre u organización</label>
                  <input
                    value={nombre || usuario?.nombre || ''}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Comité de playas de San Antón"
                    maxLength={60}
                  />
                </div>

                {/* Resumen */}
                <div style={{ background: 'var(--verde-50)', border: '1px solid var(--verde-200)', borderRadius: 'var(--radio-md)', padding: '16px 18px' }}>
                  <strong style={{ fontFamily: 'var(--fuente-titulo)', fontSize: '0.88rem', color: 'var(--verde-800)' }}>RESUMEN DEL REPORTE</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10, fontSize: '0.85rem' }}>
                    <span className="flex-centro gap-1"><MapPin size={13} /> {coords ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}` : '—'}</span>
                    <span className="flex-centro gap-1"><MapPinned size={13} /> {ZONAS.find((z) => z.id === zona)?.nombre || 'Sin asignar'}</span>
                    <span className="flex-centro gap-1"><Tag size={13} /> {TIPOS_RESIDUO.find((t) => t.id === tipo)?.nombre || '—'}</span>
                    <span className="flex-centro gap-1"><Weight size={13} /> {kg} kg</span>
                    <span className="flex-centro gap-1"><Camera size={13} /> {foto ? 'Adjunta' : 'Sin foto'}</span>
                    <span className="flex-centro gap-1"><Mail size={13} /> Aviso inmediato</span>
                  </div>
                </div>

                {errorEnvio && (
                  <p className="acceso-error mt-2">{errorEnvio}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navegación entre pasos */}
          <div className="flex-centro gap-2 entrepuesto mt-4" style={{ borderTop: '1px solid var(--linea)', paddingTop: 22 }}>
            <button
              className="btn btn-secundario"
              onClick={() => setPaso((p) => Math.max(1, p - 1))}
              disabled={paso === 1}
              style={{ visibility: paso === 1 ? 'hidden' : 'visible' }}
            >
              <ChevronLeft size={17} /> Atrás
            </button>

            <span className="texto-suave" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
              Paso {paso} de 3
            </span>

            {paso < 3 ? (
              <button className="btn btn-primario" onClick={() => setPaso((p) => p + 1)} disabled={!puedeAvanzar}>
                Continuar <ChevronRight size={17} />
              </button>
            ) : (
              <button className="btn btn-primario" onClick={enviar} disabled={!puedeAvanzar || enviando}>
                {enviando ? (
                  <>
                    <motion.span
                      style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    />
                    Enviando…
                  </>
                ) : (
                  <><Send size={16} /> Enviar reporte</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="texto-centro texto-suave mt-3" style={{ fontSize: '0.83rem' }}>
          <Mail size={13} style={{ verticalAlign: -2 }} /> Al enviar, el sistema notifica por correo a la coordinación
          del proyecto · Cumple con la Ley 1581 de 2012 en la versión definitiva
        </p>
      </div>
    </PageWrapper>
  )
}
