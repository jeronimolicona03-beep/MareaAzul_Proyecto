import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Camera, BarChart3, Shield, Waves, Anchor, Fish, Trash2,
  ArrowRight, Sprout, Users, Globe2, ClipboardList, Map, LineChart,
  TriangleAlert, FolderOpen, HeartHandshake, Quote, CheckCircle2,
} from 'lucide-react'
import PageWrapper from '../components/PageWrapper.jsx'
import Contador from '../components/Contador.jsx'
import { useReportes } from '../store/ReportesContext.jsx'
import { useAjustes } from '../store/AjustesContext.jsx'
import { REQUISITOS } from '../data/mock.js'

const aparecer = {
  oculto: { opacity: 0, y: 34 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  }),
}

const moduloCards = [
  { to: '/reportar', icono: Camera, titulo: 'Reporte ciudadano', desc: 'Registra un punto de acumulación con ubicación GPS, tipo de residuo y evidencia fotográfica.', color: '#22c55e' },
  { to: '/mapa', icono: Map, titulo: 'Mapa real 2D y 3D', desc: 'Cartografía real con relieve, mapa de calor de reportes y selección de la zona afectada.', color: '#0ea5e9' },
  { to: '/panel', icono: Shield, titulo: 'Panel administrativo', desc: 'Gestión total: reportes, correos, usuarios, contenido del sitio y ajustes.', color: '#8b5cf6' },
  { to: '/indicadores', icono: BarChart3, titulo: 'Indicadores', desc: 'Zonas más afectadas, residuos predominantes, evolución mensual y cronograma.', color: '#f59e0b' },
]

export default function Inicio() {
  const { total, kgTotal, porcentajeResuelto, reportes } = useReportes()
  const { ajustes, esVisible } = useAjustes()

  const seccion = (id) => esVisible(id)

  return (
    <PageWrapper>
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="deco deco-1" />
        <div className="deco deco-2" />

        <div className="contenedor hero-contenido">
          <div>
            <motion.span className="etiqueta" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <Fish size={14} /> ODS 14 · Vida Submarina — Meta 14.1
            </motion.span>

            <motion.h1 initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              {renderTitulo(ajustes.hero_titulo)}
            </motion.h1>

            <motion.p className="lead" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.7 }}>
              {ajustes.hero_subtitulo}
            </motion.p>

            <motion.div className="hero-acciones" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.7 }}>
              <Link to="/reportar" className="btn btn-primario btn-lg">
                <Camera size={19} /> Hacer un reporte
              </Link>
              <Link to="/mapa" className="btn btn-secundario btn-lg">
                <MapPin size={19} /> Ver el mapa 2D/3D
              </Link>
            </motion.div>

            <motion.div
              className="flex gap-3 envolver mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              style={{ color: 'var(--texto-suave)', fontSize: '0.87rem', fontWeight: 600 }}
            >
              <span className="flex-centro gap-1"><Sprout size={16} className="verde" /> Gratuito y comunitario</span>
              <span className="flex-centro gap-1"><Globe2 size={16} className="verde" /> Móvil y escritorio</span>
            </motion.div>
          </div>

          {/* Visual: fotografía real de la costa */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 60, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-mapa-tarjeta anim-flotar">
              <div className="hero-mapa-cabecera">
                <span><MapPin size={15} /> Costa del departamento de Córdoba</span>
                <span style={{ fontSize: '0.76rem', opacity: 0.9, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <i className="punto-encendido" /> EN VIVO
                </span>
              </div>
              <div className="hero-foto">
                <img src="/img/hero-playa.jpg" alt="Playa del Caribe colombiano" />
                <div className="hero-foto-deg" />
                <div className="hero-foto-datos">
                  <div><b>{total}</b><span>reportes</span></div>
                  <div><b>{kgTotal.toLocaleString('es-CO')}</b><span>kg estimados</span></div>
                  <div><b>8</b><span>zonas</span></div>
                </div>
              </div>
            </div>

            <div className="chip-flotante anim-flotar-inv" style={{ top: '5%', right: '-5%', animationDelay: '0.4s' }}>
              <span className="ico" style={{ background: '#dcfce7', color: '#15803d' }}><CheckCircle2 size={18} /></span>
              <span>Reporte verificado<br /><small style={{ color: 'var(--texto-suave)', fontWeight: 500 }}>San Antón · hace 2 h</small></span>
            </div>

            <div className="chip-flotante anim-flotar" style={{ bottom: '7%', left: '-6%', animationDelay: '1.2s' }}>
              <span className="ico" style={{ background: '#e0f2fe', color: '#0369a1' }}><BarChart3 size={18} /></span>
              <span>+128 reportes<br /><small style={{ color: 'var(--texto-suave)', fontWeight: 500 }}>este mes en la costa</small></span>
            </div>
          </motion.div>
        </div>

        <div className="olas" aria-hidden="true">
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
            <path fill="#f7fbf6" d="M0,50 C240,95 480,5 720,45 C960,85 1200,25 1440,55 L1440,90 L0,90 Z" />
          </svg>
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
            <path fill="#f7fbf6" d="M0,50 C240,95 480,5 720,45 C960,85 1200,25 1440,55 L1440,90 L0,90 Z" />
          </svg>
        </div>
      </section>

      {/* ================= MARQUESINA ================= */}
      <div className="marquesina">
        <div className="marquesina-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="marquesina-item" style={{ display: 'inline-flex', gap: 46 }}>
              <span className="flex-centro gap-1"><Waves size={15} /> Meta 14.1 · Reducir la contaminación marina</span>
              <span className="flex-centro gap-1"><Sprout size={15} /> Economía circular</span>
              <span className="flex-centro gap-1"><Users size={15} /> Ciencia ciudadana</span>
              <span className="flex-centro gap-1"><MapPin size={15} /> Georreferenciación de reportes</span>
              <span className="flex-centro gap-1"><Fish size={15} /> Conservación de ecosistemas marinos</span>
              <span className="flex-centro gap-1"><Trash2 size={15} /> Jornadas de limpieza priorizadas</span>
            </span>
          ))}
        </div>
      </div>

      {/* ================= ESTADÍSTICAS ================= */}
      <section className="contenedor mt-5">
        <div className="stats-grid">
          {[
            { icono: ClipboardList, valor: total, sufijo: '', label: 'Reportes registrados' },
            { icono: Trash2, valor: kgTotal, sufijo: ' kg', label: 'Volumen estimado reportado' },
            { icono: MapPin, valor: 8, sufijo: '', label: 'Zonas monitoreadas en Córdoba' },
            { icono: Waves, valor: porcentajeResuelto, sufijo: '%', label: 'Reportes resueltos' },
          ].map((s, i) => (
            <motion.div key={s.label} className="stat-card" variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true, margin: '-60px' }} custom={i}>
              <div className="stat-ico"><s.icono size={26} /></div>
              <div className="stat-valor"><Contador hasta={s.valor} sufijo={s.sufijo} /></div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= PROBLEMÁTICA ================= */}
      {seccion('problema') && (
        <section className="contenedor mt-5">
          <div className="texto-centro" style={{ maxWidth: 720, marginInline: 'auto' }}>
            <motion.span className="etiqueta" variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true }}>
              <TriangleAlert size={14} /> El problema
            </motion.span>
            <motion.h2 className="titulo-seccion" variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true }}>
              Millones de toneladas de residuos llegan al mar cada año
            </motion.h2>
            <motion.p className="subtitulo-seccion" style={{ marginInline: 'auto' }} variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true }}>
              En la costa de Córdoba el seguimiento de los puntos de acumulación se hace de forma manual:
              recorridos físicos, actas en papel y hojas de cálculo dispersas, sin información oportuna
              para priorizar las jornadas de limpieza.
            </motion.p>
          </div>

          <div className="problema-grid mt-4">
            {[
              { img: '/img/problema-residuos.jpg', alt: 'Residuos plásticos en la playa', icono: Globe2, titulo: 'Contaminación marina', desc: 'Jambeck et al. (2015) estiman varios millones de toneladas de plástico ingresando cada año a los océanos desde las zonas costeras.' },
              { img: '/img/problema-plastico.jpg', alt: 'Residuos plásticos acumulados', icono: Trash2, titulo: 'Seguimiento manual', desc: 'Reportes en papel y hojas de cálculo no centralizadas impiden consolidar el histórico y medir el impacto de las jornadas.' },
              { img: '/img/problema-jornada.jpg', alt: 'Jornada de limpieza de playas', icono: Users, titulo: 'Participación limitada', desc: 'No existen mecanismos accesibles para que la ciudadanía reporte y haga seguimiento a los puntos críticos de su zona.' },
            ].map((c, i) => (
              <motion.article
                key={c.titulo}
                className="tarjeta tarjeta-hover problema-carta"
                variants={aparecer}
                initial="oculto"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                custom={i}
              >
                <div className="problema-foto">
                  <img src={c.img} alt={c.alt} loading="lazy" />
                </div>
                <div style={{ padding: '20px 22px 24px' }}>
                  <div className="flex-centro gap-2 mb-1">
                    <span className="mini-ico" style={{ background: 'var(--verde-100)', color: 'var(--verde-600)' }}><c.icono size={17} /></span>
                    <h3 style={{ fontSize: '1.08rem', color: 'var(--verde-900)' }}>{c.titulo}</h3>
                  </div>
                  <p className="texto-suave" style={{ fontSize: '0.92rem' }}>{c.desc}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      )}

      {/* ================= CÓMO FUNCIONA ================= */}
      {seccion('como') && (
        <section className="mt-5" style={{ background: 'linear-gradient(180deg, transparent, var(--verde-50) 22%, var(--verde-50) 78%, transparent)', padding: '70px 0' }}>
          <div className="contenedor">
            <div className="texto-centro">
              <motion.span className="etiqueta" variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true }}>
                <HeartHandshake size={14} /> Cómo funciona
              </motion.span>
              <motion.h2 className="titulo-seccion" variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true }}>
                Tres pasos para una costa más limpia
              </motion.h2>
            </div>

            <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22 }}>
              {[
                { n: '01', icono: Camera, titulo: 'Reporta', desc: 'La ciudadanía registra un punto de acumulación: ubicación real en el mapa, tipo de residuo y foto.' },
                { n: '02', icono: Shield, titulo: 'Verifica', desc: 'El equipo administrativo valida, clasifica y actualiza el estado; el reporte dispara un correo inmediato.' },
                { n: '03', icono: BarChart3, titulo: 'Decide', desc: 'Los indicadores permiten priorizar jornadas de limpieza con información real y oportuna.' },
              ].map((p, i) => (
                <motion.div
                  key={p.n}
                  className="tarjeta tarjeta-hover"
                  variants={aparecer}
                  initial="oculto"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  custom={i}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  <span className="pasos-num">{p.n}</span>
                  <div className="stat-ico" style={{ margin: '0 0 16px', background: 'linear-gradient(135deg, var(--verde-500), var(--verde-600))', color: 'white' }}>
                    <p.icono size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--verde-900)', marginBottom: 8 }}>{p.titulo}</h3>
                  <p className="texto-suave" style={{ fontSize: '0.94rem', position: 'relative' }}>{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= MÓDULOS ================= */}
      {seccion('modulos') && (
        <section className="contenedor mt-5">
          <motion.span className="etiqueta" variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true }}>
            <FolderOpen size={14} /> Módulos del sistema
          </motion.span>
          <motion.h2 className="titulo-seccion" variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true }}>
            Explora el prototipo
          </motion.h2>
          <motion.p className="subtitulo-seccion" variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true }}>
            Cada módulo corresponde a los requisitos funcionales planteados en el anteproyecto (RF-01 a RF-06).
          </motion.p>

          <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: 22 }}>
            {moduloCards.map((m, i) => (
              <motion.div key={m.titulo} variants={aparecer} initial="oculto" whileInView="visible" viewport={{ once: true, margin: '-60px' }} custom={i}>
                <Link to={m.to} className="tarjeta tarjeta-hover" style={{ display: 'block', height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div className="stat-ico" style={{ margin: '0 0 16px', background: `${m.color}1c`, color: m.color }}>
                    <m.icono size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--verde-900)', marginBottom: 8 }}>{m.titulo}</h3>
                  <p className="texto-suave" style={{ fontSize: '0.92rem', marginBottom: 16 }}>{m.desc}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: m.color, fontWeight: 700, fontSize: '0.88rem' }}>
                    Abrir módulo <ArrowRight size={16} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ================= REQUISITOS ================= */}
      {seccion('requisitos') && (
        <section className="contenedor mt-5">
          <div className="tarjeta" style={{ padding: '38px', background: 'linear-gradient(150deg, var(--verde-950), var(--verde-800))', border: 'none', color: 'white' }}>
            <div className="flex-centro gap-2 envolver entrepuesto" style={{ marginBottom: 26 }}>
              <div>
                <span className="etiqueta" style={{ background: 'rgba(255,255,255,.13)', color: 'var(--verde-200)', borderColor: 'rgba(255,255,255,.2)' }}>
                  <ClipboardList size={13} /> Anteproyecto
                </span>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', marginTop: 14 }}>Requisitos funcionales del sistema</h2>
              </div>
              <Link to="/indicadores" className="btn btn-fantasma" style={{ color: 'white' }}>
                <LineChart size={17} /> Ver indicadores
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {REQUISITOS.map((r, i) => (
                <motion.div
                  key={r.codigo}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className="requisito-fila"
                >
                  <span className="requisito-codigo">{r.codigo}</span>
                  <span style={{ fontSize: '0.87rem', color: '#d1fae5', lineHeight: 1.5 }}>{r.desc}</span>
                  <span className={`badge ${r.prio === 'Alta' ? 'badge-resuelto' : 'badge-verificado'}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    {r.prio}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CTA FINAL ================= */}
      {seccion('cta') && (
        <section className="contenedor mt-5 texto-centro">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="cta-final"
          >
            <img src="/img/ods-tortuga.jpg" alt="Tortuga marina nadando" className="cta-fondo" />
            <div className="cta-cap" />
            <div style={{ position: 'relative' }}>
              <Quote size={38} style={{ color: 'var(--lima)' }} />
              <h2 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.6rem)', fontWeight: 800, margin: '14px auto', maxWidth: 700 }}>
                {ajustes.cta_titulo}
              </h2>
              <p style={{ color: '#e7f9ee', maxWidth: 580, margin: '0 auto 30px', fontSize: '1.03rem' }}>
                {ajustes.cta_texto}
              </p>
              <div className="flex gap-2 envolver" style={{ justifyContent: 'center' }}>
                <Link to="/reportar" className="btn btn-lg" style={{ background: 'white', color: 'var(--verde-800)' }}>
                  <Camera size={19} /> Reportar ahora
                </Link>
                <Link to="/mapa" className="btn btn-fantasma btn-lg" style={{ color: 'white' }}>
                  <Map size={19} /> Explorar el mapa
                </Link>
              </div>
              <div className="flex gap-3 envolver" style={{ justifyContent: 'center', marginTop: 34, color: '#bbf7d0', fontSize: '0.85rem', fontWeight: 600 }}>
                <span className="flex-centro gap-1"><Anchor size={15} /> Córdoba, Colombia</span>
                <span className="flex-centro gap-1"><Fish size={15} /> Vida submarina</span>
                <span className="flex-centro gap-1"><Waves size={15} /> Agenda 2030</span>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Aviso de mantenimiento */}
      {ajustes.mantenimiento === '1' && (
        <div className="contenedor mt-3">
          <div className="acceso-error" style={{ justifyContent: 'center' }}>
            <TriangleAlert size={16} /> El sitio está en modo mantenimiento: publicado por el administrador.
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

/** Divide el título editable en texto + palabra con degradado */
function renderTitulo(titulo) {
  const texto = titulo || 'Cuida la costa, reporta el residuo.'
  const partes = texto.split(',')
  if (partes.length < 2) return texto
  return (
    <>
      {partes[0]},
      <br />
      <span className="gradiente-verde">{partes.slice(1).join(',').trim()}</span>
    </>
  )
}
