import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, apiDisponible, getToken, setToken, verificarServidor } from '../api.js'

const AuthContext = createContext(null)

/** Usuarios demo cuando el servidor NO está activo (modo estático) */
const DEMO_LOCAL = [
  { id: 1, nombre: 'Administrador Marea Verde', email: 'admin@mareaverde.co', rol: 'admin', password: 'admin123' },
  { id: 2, nombre: 'Ciudadano Demo', email: 'ciudadano@demo.co', rol: 'ciudadano', password: 'ciudadano123' },
]

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [modoLocal, setModoLocal] = useState(false)

  useEffect(() => {
    ;(async () => {
      const disponible = await verificarServidor()
      setModoLocal(!disponible)
      if (!disponible) {
        // Modo local: restaurar sesión simulada
        try {
          const guardado = JSON.parse(localStorage.getItem('mv-sesion-local') || 'null')
          if (guardado) setUsuario(guardado)
        } catch { /* nada */ }
        setCargando(false)
        return
      }
      if (getToken()) {
        try {
          const { usuario: u } = await api.yo()
          setUsuario(u)
        } catch {
          setToken(null)
        }
      }
      setCargando(false)
    })()
  }, [])

  const entrar = useCallback(async ({ email, password }) => {
    if (apiDisponible() === false || modoLocal) {
      const demo = DEMO_LOCAL.find((u) => u.email === email.trim().toLowerCase() && u.password === password)
      if (!demo) throw new Error('Correo o contraseña incorrectos (modo demo local)')
      const u = { id: demo.id, nombre: demo.nombre, email: demo.email, rol: demo.rol }
      localStorage.setItem('mv-sesion-local', JSON.stringify(u))
      setUsuario(u)
      return u
    }
    const { usuario: u, token } = await api.login({ email, password })
    setToken(token)
    setUsuario(u)
    return u
  }, [modoLocal])

  const registrarse = useCallback(async ({ nombre, email, password }) => {
    if (apiDisponible() === false || modoLocal) {
      const u = { id: Date.now(), nombre, email: email.toLowerCase(), rol: 'ciudadano' }
      localStorage.setItem('mv-sesion-local', JSON.stringify(u))
      setUsuario(u)
      return u
    }
    const { usuario: u, token } = await api.registro({ nombre, email, password })
    setToken(token)
    setUsuario(u)
    return u
  }, [modoLocal])

  const salir = useCallback(async () => {
    try {
      if (apiDisponible() !== false && !modoLocal && getToken()) await api.logout()
    } catch { /* sesión ya cerrada */ }
    setToken(null)
    localStorage.removeItem('mv-sesion-local')
    setUsuario(null)
  }, [modoLocal])

  const valor = {
    usuario,
    cargando,
    modoLocal: modoLocal || apiDisponible() === false,
    esAdmin: usuario?.rol === 'admin',
    entrar,
    registrarse,
    salir,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
