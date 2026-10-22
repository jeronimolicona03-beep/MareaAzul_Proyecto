import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { User, ShieldCheck, LogIn, UserPlus, ArrowRight, Mail, Lock, AlertTriangle, Waves } from 'lucide-react'
import PageWrapper from '../components/PageWrapper.jsx'
import { useAuth } from '../store/AuthContext.jsx'

export default function Acceso() {
  const { entrar, registrarse, usuario, esAdmin, modoLocal } = useAuth()
  const navegar = useLocation()
  const navigate = useNavigate()

  const [tipo, setTipo] = useState('ciudadano') // 'ciudadano' | 'admin'
  const [modo, setModo] = useState('entrar') // 'entrar' | 'crear'
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const destino = navegar.state?.destino || (esAdmin ? '/panel' : '/')

  const cambiar = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      if (tipo === 'admin' || modo === 'entrar') {
        const u = await entrar({ email: form.email, password: form.password })
        if (tipo === 'admin' && u.rol !== 'admin') throw new Error('Ese correo no tiene rol administrador')
        navigate(tipo === 'admin' ? '/panel' : destino, { replace: true })
      } else {
        const u = await registrarse(form)
        navigate(destino === '/panel' ? '/' : destino, { replace: true })
        void u
      }
    } catch (err) {
      setError(err.message || 'No fue posible completar la operación')
    } finally {
      setEnviando(false)
    }
  }

  const accesoRapido = (email, password) => {
    setForm((f) => ({ ...f, email, password }))
  }

  if (usuario) {
    return (
      <PageWrapper>
        <div className="pagina">
          <div className="contenedor">
            <div className="login-tarjeta">
              <div className="stat-ico" style={{ margin: '0 auto 16px' }}>
                {esAdmin ? <ShieldCheck size={28} /> : <User size={28} />}
              </div>
              <h1 style={{ fontSize: '1.5rem', color: 'var(--verde-900)' }}>Sesión iniciada</h1>
              <p className="texto-suave mt-1">
                {usuario.nombre} · {usuario.email} ({esAdmin ? 'administrador' : 'ciudadano'})
              </p>
              <div className="flex gap-2 envolver mt-3" style={{ justifyContent: 'center' }}>
                <button className="btn btn-primario" onClick={() => navigate(esAdmin ? '/panel' : '/reportar')}>
                  Ir a {esAdmin ? 'el panel' : 'reportar'} <ArrowRight size={16} />
                </button>
                <Link to="/" className="btn btn-secundario">Volver al inicio</Link>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="acceso-envoltura">
        {/* Panel visual */}
        <aside className="acceso-visual">
          <img src="/img/hero-playa.jpg" alt="Costa del Caribe colombiano" />
          <div className="acceso-visual-cap">
            <Link to="/" className="logo" style={{ color: 'white' }}>
              <span className="logo-icono"><Waves size={22} strokeWidth={2.4} /></span>
              <span>MareaVerde</span>
            </Link>
            <div>
              <span className="etiqueta" style={{ background: 'rgba(255,255,255,.16)', color: 'white', borderColor: 'rgba(255,255,255,.28)' }}>
                ODS 14 · Vida Submarina
              </span>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.2rem)', margin: '16px 0 12px' }}>
                Elige cómo quieres entrar al sistema
              </h2>
              <p style={{ color: '#d1fae5', fontSize: '0.97rem', maxWidth: 420 }}>
                La ciudadanía registra y da seguimiento a los reportes de residuos; el equipo
                administrativo verifica, gestiona y controla el contenido del sitio.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: '0.84rem', fontWeight: 600, color: '#bbf7d0' }}>
              <span>· Registro ciudadano</span>
              <span>· Acceso administrativo</span>
              <span>· Datos protegidos (Ley 1581/2012)</span>
            </div>
          </div>
        </aside>

        {/* Formulario */}
        <main className="acceso-form">
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <h1 style={{ fontSize: '1.7rem', color: 'var(--verde-900)' }}>Acceso al sistema</h1>
            <p className="texto-suave mt-1 mb-3" style={{ fontSize: '0.95rem' }}>
              Selecciona el tipo de acceso que necesitas.
            </p>

            {/* Selector de rol */}
            <div className="acceso-roles">
              <button
                type="button"
                className={`acceso-rol ${tipo === 'ciudadano' ? 'activo' : ''}`}
                onClick={() => { setTipo('ciudadano'); setError('') }}
              >
                <User size={20} />
                <strong>Ciudadanía</strong>
                <span>Reportar y consultar residuos</span>
              </button>
              <button
                type="button"
                className={`acceso-rol ${tipo === 'admin' ? 'activo' : ''}`}
                onClick={() => { setTipo('admin'); setModo('entrar'); setError('') }}
              >
                <ShieldCheck size={20} />
                <strong>Administrador</strong>
                <span>Gestión total del sistema y del sitio</span>
              </button>
            </div>

            {/* Pestañas ciudadano */}
            {tipo === 'ciudadano' && (
              <div className="acceso-tabs">
                <button type="button" className={modo === 'entrar' ? 'activo' : ''} onClick={() => setModo('entrar')}>
                  <LogIn size={15} /> Iniciar sesión
                </button>
                <button type="button" className={modo === 'crear' ? 'activo' : ''} onClick={() => setModo('crear')}>
                  <UserPlus size={15} /> Crear cuenta
                </button>
              </div>
            )}

            <form onSubmit={enviar}>
              <AnimatePresence mode="wait">
                {tipo === 'ciudadano' && modo === 'crear' && (
                  <motion.div key="nombre" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="campo">
                      <label><User size={14} /> Nombre completo u organización</label>
                      <input value={form.nombre} onChange={cambiar('nombre')} placeholder="Ej: Comité de playas de San Antón" autoComplete="name" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="campo">
                <label><Mail size={14} /> Correo electrónico</label>
                <input type="email" value={form.email} onChange={cambiar('email')} placeholder="tu@correo.com" autoComplete="email" required />
              </div>

              <div className="campo">
                <label><Lock size={14} /> Contraseña</label>
                <input type="password" value={form.password} onChange={cambiar('password')} placeholder="Mínimo 6 caracteres" autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} required />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="acceso-error">
                    <AlertTriangle size={15} /> {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button className="btn btn-primario btn-lg" style={{ width: '100%' }} disabled={enviando}>
                {enviando ? (
                  <motion.span
                    style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  />
                ) : tipo === 'admin' ? (
                  <><ShieldCheck size={17} /> Entrar al panel administrativo</>
                ) : modo === 'crear' ? (
                  <><UserPlus size={17} /> Crear cuenta ciudadana</>
                ) : (
                  <><LogIn size={17} /> Entrar como ciudadano</>
                )}
              </button>
            </form>

            {/* Acceso demo */}
            <div className="acceso-demo">
              <strong>Credenciales de demostración</strong>
              <div className="acceso-demo-opciones">
                <button type="button" onClick={() => { setTipo('admin'); accesoRapido('admin@mareaverde.co', 'admin123') }}>
                  <ShieldCheck size={14} /> admin@mareaverde.co · admin123
                </button>
                <button type="button" onClick={() => { setTipo('ciudadano'); setModo('entrar'); accesoRapido('maria@comunidad.co', 'ciudadano123') }}>
                  <User size={14} /> maria@comunidad.co · ciudadano123
                </button>
              </div>
              {modoLocal && (
                <p className="acceso-local">
                  Servidor no detectado: la sesión funcionará en modo demo local sin base de datos.
                </p>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </PageWrapper>
  )
}
