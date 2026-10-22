import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Waves, Camera, User, ShieldCheck, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../store/AuthContext.jsx'
import { useAjustes } from '../store/AjustesContext.jsx'

const enlaces = [
  { to: '/', label: 'Inicio' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/indicadores', label: 'Indicadores' },
  { to: '/reportar', label: 'Reportar' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [menuUsuario, setMenuUsuario] = useState(false)
  const location = useLocation()
  const navegar = useNavigate()
  const { usuario, esAdmin, salir } = useAuth()
  const { ajustes } = useAjustes()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setAbierto(false); setMenuUsuario(false) }, [location.pathname])

  const esInicio = location.pathname === '/'
  const transparente = esInicio && !scrolled

  const cerrar = async () => {
    await salir()
    navegar('/')
  }

  return (
    <>
      <header className={`navbar ${transparente ? 'navbar-transparente' : 'navbar-solido'}`}>
        <div className="contenedor navbar-inner">
          <Link to="/" className="logo">
            <span className="logo-icono"><Waves size={22} strokeWidth={2.4} /></span>
            <span>{(ajustes.nombre_sitio || 'Marea Verde').replace(/\s+/g, '')}</span>
          </Link>

          <nav>
            <ul className="nav-links">
              {enlaces.map((e) => (
                <li key={e.to}>
                  <NavLink to={e.to} end={e.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'activo' : ''}`}>
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span layoutId="nav-activo" className="nav-subrayado" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                        )}
                        {e.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
              {esAdmin && (
                <li>
                  <NavLink to="/panel" className={({ isActive }) => `nav-link ${isActive ? 'activo' : ''}`}>
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span layoutId="nav-activo" className="nav-subrayado" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                        )}
                        Panel
                      </>
                    )}
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>

          <div className="nav-cta">
            <Link to="/reportar" className="btn btn-primario btn-sm">
              <Camera size={16} /> Nuevo reporte
            </Link>

            {usuario ? (
              <div className="nav-usuario">
                <button className="nav-usuario-btn" onClick={() => setMenuUsuario((v) => !v)} type="button">
                  <span className="nav-usuario-ico">{esAdmin ? <ShieldCheck size={16} /> : <User size={16} />}</span>
                  <span className="nav-usuario-nombre">{usuario.nombre.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {menuUsuario && (
                    <motion.div
                      className="nav-usuario-menu"
                      initial={{ opacity: 0, y: -10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    >
                      <div className="nav-usuario-cab">
                        <strong>{usuario.nombre}</strong>
                        <span>{usuario.email}</span>
                        <em>{esAdmin ? 'Administrador' : 'Ciudadano'}</em>
                      </div>
                      {esAdmin && <Link to="/panel" className="nav-usuario-op"><ShieldCheck size={15} /> Panel administrativo</Link>}
                      <Link to="/reportar" className="nav-usuario-op"><Camera size={15} /> Hacer un reporte</Link>
                      <button className="nav-usuario-op peligro" onClick={cerrar} type="button"><LogOut size={15} /> Cerrar sesión</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/acceso" className="btn btn-secundario btn-sm">
                <User size={16} /> Acceder
              </Link>
            )}

            <button className="nav-toggle" onClick={() => setAbierto((v) => !v)} aria-label="Abrir menú">
              {abierto ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {abierto && (
          <motion.nav
            className="nav-movil"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {enlaces.map((e, i) => (
              <motion.div key={e.to} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                <NavLink to={e.to} end={e.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'chip-activo' : ''}`}>
                  {e.label}
                </NavLink>
              </motion.div>
            ))}
            {esAdmin && (
              <NavLink to="/panel" className={({ isActive }) => `nav-link ${isActive ? 'chip-activo' : ''}`}>Panel administrativo</NavLink>
            )}
            <Link to={usuario ? '/reportar' : '/acceso'} className="btn btn-primario mt-2" style={{ width: '100%' }}>
              {usuario ? <><Camera size={16} /> Nuevo reporte</> : <><User size={16} /> Acceder al sistema</>}
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
