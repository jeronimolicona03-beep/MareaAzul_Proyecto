import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { api, apiDisponible, getToken, verificarServidor } from '../api.js'
import { REPORTES_INICIALES, TIPOS_RESIDUO, ZONAS } from '../data/mock.js'

const CLAVE_LOCAL = 'marea-verde-reportes-v1'
const AjustesContext = createContext(null)

const DEFECTO = {
  nombre_sitio: 'Marea Azul',
  contacto_email: 'contacto@mareazul.co',
  contacto_telefono: '+57 (604) 782 0000',
  hero_titulo: 'Cuida la costa, reporta el residuo.',
  hero_subtitulo:
    'Sistema de información para el monitoreo y la gestión de residuos sólidos en ambientes marino-costeros del departamento de Córdoba. Reporta, geolocaliza y da seguimiento a los puntos críticos de acumulación de residuos.',
  cta_titulo: 'Tu reporte puede cambiar una costa',
  cta_texto:
    'Únete a la ciencia ciudadana: cada punto que marcas ayuda a priorizar las jornadas de limpieza y al cumplimiento de la meta 14.1 del ODS 14.',
  banner_activo: '0',
  banner_texto: '',
  secciones_visibles: 'problema,como,modulos,requisitos,cta',
  tema_primario: '#1e6fb8',
  tema_acento: '#22d3ee',
  mantenimiento: '0',
  umbral_alerta_kg: '150',
}

export function AjustesProvider({ children }) {
  const [ajustes, setAjustes] = useState(DEFECTO)
  const [listo, setListo] = useState(false)

  const aplicarTema = useCallback((a) => {
    const root = document.documentElement
    if (a.tema_primario) {
      root.style.setProperty('--verde-600', a.tema_primario)
      root.style.setProperty('--verde-700', oscurecer(a.tema_primario, 0.18))
      root.style.setProperty('--verde-800', oscurecer(a.tema_primario, 0.32))
      root.style.setProperty('--verde-900', oscurecer(a.tema_primario, 0.45))
      root.style.setProperty('--verde-950', oscurecer(a.tema_primario, 0.58))
      root.style.setProperty('--verde-500', aclarar(a.tema_primario, 0.12))
      root.style.setProperty('--verde-400', aclarar(a.tema_primario, 0.3))
      root.style.setProperty('--verde-300', aclarar(a.tema_primario, 0.5))
      root.style.setProperty('--verde-200', aclarar(a.tema_primario, 0.68))
      root.style.setProperty('--verde-100', aclarar(a.tema_primario, 0.85))
    }
    if (a.tema_acento) root.style.setProperty('--lima', a.tema_acento)
    if (a.nombre_sitio) document.title = `${a.nombre_sitio} · Monitoreo de residuos marino-costeros · ODS 14`
  }, [])

  const refrescar = useCallback(async () => {
    try {
      if (apiDisponible() === false) {
        const guardado = JSON.parse(localStorage.getItem('mv-ajustes') || 'null')
        if (guardado) { setAjustes({ ...DEFECTO, ...guardado }); aplicarTema({ ...DEFECTO, ...guardado }) }
        setListo(true)
        return
      }
      const a = await api.ajustes()
      setAjustes({ ...DEFECTO, ...a })
      aplicarTema({ ...DEFECTO, ...a })
    } catch {
      /* se mantienen los valores por defecto */
    }
    setListo(true)
  }, [aplicarTema])

  useEffect(() => {
    ;(async () => {
      await verificarServidor()
      refrescar()
    })()
  }, [refrescar])

  const guardar = useCallback(
    async (parciales) => {
      const nuevos = { ...ajustes, ...parciales }
      setAjustes(nuevos)
      aplicarTema(nuevos)
      if (apiDisponible() === false || !getToken()) {
        localStorage.setItem('mv-ajustes', JSON.stringify(nuevos))
        return
      }
      try {
        await api.guardarAjustes(parciales)
      } catch {
        /* sin permisos o sin servidor */
      }
    },
    [ajustes, aplicarTema],
  )

  const valor = useMemo(
    () => ({ ajustes, listo, guardar, refrescar, esVisible: (s) => (ajustes.secciones_visibles || '').includes(s) }),
    [ajustes, listo, guardar, refrescar],
  )

  return <AjustesContext.Provider value={valor}>{children}</AjustesContext.Provider>
}

export function useAjustes() {
  const ctx = useContext(AjustesContext)
  if (!ctx) throw new Error('useAjustes debe usarse dentro de AjustesProvider')
  return ctx
}

/* ---------- utilidades de color ---------- */
function mezclar(hex, blanco, cantidad) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const r = Math.round(((n >> 16) & 255) * (1 - cantidad) + 255 * cantidad)
  const g = Math.round(((n >> 8) & 255) * (1 - cantidad) + 255 * cantidad)
  const b = Math.round((n & 255) * (1 - cantidad) + 255 * cantidad)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
const aclarar = (hex, c) => mezclar(hex, true, c)
const oscurecer = (hex, c) => mezclar(hex, false, c)
