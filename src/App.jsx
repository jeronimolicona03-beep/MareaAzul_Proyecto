import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Inicio from './pages/Inicio.jsx'
import Mapa from './pages/Mapa.jsx'
import Reportar from './pages/Reportar.jsx'
import Panel from './pages/Panel.jsx'
import Indicadores from './pages/Indicadores.jsx'
import Acceso from './pages/Acceso.jsx'
import { ReportesProvider } from './store/ReportesContext.jsx'
import { AuthProvider, useAuth } from './store/AuthContext.jsx'
import { AjustesProvider, useAjustes } from './store/AjustesContext.jsx'
import { Megaphone } from 'lucide-react'

/* Banner de aviso configurable desde el panel (fijo abajo) */
function BannerAviso() {
  const { ajustes } = useAjustes()
  if (ajustes.banner_activo !== '1' || !ajustes.banner_texto) return null
  return (
    <div className="banner-aviso">
      <Megaphone size={15} style={{ flexShrink: 0 }} />
      <span>{ajustes.banner_texto}</span>
    </div>
  )
}

function Protegida({ children, soloAdmin = false }) {
  const { usuario, esAdmin, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="mapa-cargando" style={{ position: 'static', background: 'var(--verde-50)' }}>
          Verificando sesión…
        </div>
      </div>
    )
  }
  if (!usuario) return <Navigate to="/acceso" state={{ destino: location.pathname }} replace />
  if (soloAdmin && !esAdmin) return <Navigate to="/acceso" state={{ destino: '/panel' }} replace />
  return children
}

export default function App() {
  const location = useLocation()

  return (
    <AjustesProvider>
      <AuthProvider>
        <ReportesProvider>
          <Navbar />
          <BannerAviso />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Inicio />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/indicadores" element={<Indicadores />} />
              <Route path="/acceso" element={<Acceso />} />
              <Route
                path="/reportar"
                element={
                  <Protegida>
                    <Reportar />
                  </Protegida>
                }
              />
              <Route
                path="/panel"
                element={
                  <Protegida soloAdmin>
                    <Panel />
                  </Protegida>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
          <Footer />
        </ReportesProvider>
      </AuthProvider>
    </AjustesProvider>
  )
}
