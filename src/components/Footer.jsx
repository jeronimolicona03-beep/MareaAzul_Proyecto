import { Link } from 'react-router-dom'
import { Waves, Github, Mail, MapPin, GraduationCap, Heart } from 'lucide-react'
import { useAjustes } from '../store/AjustesContext.jsx'

export default function Footer() {
  const { ajustes } = useAjustes()
  return (
    <footer className="footer">
      <div className="contenedor">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ color: 'white', marginBottom: 14 }}>
              <span className="logo-icono">
                <Waves size={22} strokeWidth={2.4} />
              </span>
              <span>{(ajustes.nombre_sitio || 'Marea Verde').replace(/\s+/g, '')}</span>
            </div>
            <p style={{ fontSize: '0.93rem', maxWidth: 380, color: '#86efac' }}>
              Sistema de información para el monitoreo y la gestión de residuos sólidos en ambientes
              marino-costeros del departamento de Córdoba. Prototipo desarrollado como trabajo de grado
              del programa de Ingeniería de Sistemas.
            </p>
            <div className="ods14-pill mt-3">
              <span className="ods14-num">14</span>
              ODS 14 · Vida Submarina — Meta 14.1
            </div>
          </div>

          <div>
            <h4>Navegación</h4>
            <Link to="/">Inicio</Link>
            <Link to="/mapa">Mapa de reportes</Link>
            <Link to="/reportar">Registrar reporte</Link>
            <Link to="/indicadores">Indicadores</Link>
            <Link to="/acceso">Acceso</Link>
            <Link to="/panel">Panel administrativo</Link>
          </div>

          <div>
            <h4>Proyecto de grado</h4>
            <a href="#" onClick={(e) => e.preventDefault()}>
              <GraduationCap size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              Universidad Cooperativa de Colombia
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              <MapPin size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              Sede Montería, Córdoba
            </a>
            <a href={`mailto:${ajustes.contacto_email}`}>
              <Mail size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              {ajustes.contacto_email}
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              <Github size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              Repositorio Git del proyecto
            </a>
          </div>
        </div>

        <div className="footer-nota">
          <span>© 2026 {ajustes.nombre_sitio || 'Marea Verde'} · Prototipo académico — Datos de demostración</span>
          <span className="flex-centro gap-1">
            Hecho con <Heart size={14} fill="currentColor" /> para la conservación de los océanos
          </span>
        </div>

        {ajustes.banner_activo === '1' && <div style={{ height: 42 }} aria-hidden="true" />}
      </div>
    </footer>
  )
}
