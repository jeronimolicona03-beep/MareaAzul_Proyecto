import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { api, apiDisponible, getToken, verificarServidor } from '../api.js'
import { REPORTES_INICIALES, TIPOS_RESIDUO, ZONAS, FOTOS } from '../data/mock.js'

const CLAVE = 'marea-verde-reportes-v1'
const ReportesContext = createContext(null)

export function ReportesProvider({ children }) {
  const [reportes, setReportes] = useState(REPORTES_INICIALES)
  const [origen, setOrigen] = useState('demo') // 'servidor' | 'local' | 'demo'

  const cargar = useCallback(async () => {
    const disponible = await verificarServidor()
    if (disponible) {
      try {
        const datos = await api.reportes()
        if (Array.isArray(datos) && datos.length) {
          setReportes(datos)
          setOrigen('servidor')
          return
        }
      } catch { /* cae al modo local */ }
    }
    // Modo local (sin servidor): persistencia en localStorage
    try {
      const guardado = localStorage.getItem(CLAVE)
      if (guardado) {
        const arr = JSON.parse(guardado)
        if (Array.isArray(arr) && arr.length) {
          setReportes(arr)
          setOrigen('local')
          return
        }
      }
    } catch { /* nada */ }
    setReportes(REPORTES_INICIALES)
    setOrigen('demo')
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (origen === 'local') {
      try { localStorage.setItem(CLAVE, JSON.stringify(reportes)) } catch { /* cuota */ }
    }
  }, [reportes, origen])

  const crearReporte = useCallback(async (datos) => {
    if (apiDisponible() !== false && getToken()) {
      try {
        const { reporte } = await api.crearReporte(datos)
        setReportes((prev) => [reporte, ...prev])
        return { reporte, email: null }
      } catch (e) {
        // si falla la API se propaga el error (sesión inválida, validación…)
        throw e
      }
    }
    // Fallback local
    const id = `R-${1042 + reportes.length}`
    const nuevo = {
      id,
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'pendiente',
      mes: new Date().getMonth() + 1,
      reportadoPor: 'Ciudadanía',
      direccion: '',
      foto: datos.foto || FOTOS[reportes.length % FOTOS.length],
      ...datos,
    }
    setReportes((prev) => [nuevo, ...prev])
    try {
      const local = JSON.parse(localStorage.getItem(CLAVE) || '[]')
      localStorage.setItem(CLAVE, JSON.stringify([nuevo, ...local]))
    } catch { /* cuota */ }
    return { reporte: nuevo, email: { para: 'contacto@mareaverde.co', inmediato: true } }
  }, [reportes.length])

  const actualizarReporte = useCallback(async (id, parciales) => {
    setReportes((prev) => prev.map((r) => (r.id === id ? { ...r, ...parciales } : r)))
    if (apiDisponible() !== false && getToken()) {
      try { await api.actualizarReporte(id, parciales) } catch { /* sin permisos */ }
    }
  }, [])

  const cambiarEstado = useCallback((id, estado) => actualizarReporte(id, { estado }), [actualizarReporte])

  const eliminarReporte = useCallback(async (id) => {
    setReportes((prev) => prev.filter((r) => r.id !== id))
    if (apiDisponible() !== false && getToken()) {
      try { await api.eliminarReporte(id) } catch { /* sin permisos */ }
    }
  }, [])

  const restaurarReporte = useCallback(async (reporte) => {
    if (apiDisponible() !== false && getToken()) {
      try { await api.actualizarReporte(reporte.id, { eliminado: 0 }) } catch { /* sin permisos */ }
    }
    setReportes((prev) => (prev.some((r) => r.id === reporte.id) ? prev : [reporte, ...prev]))
  }, [])

  const valor = useMemo(() => {
    const detalle = reportes.map((r, i) => ({
      ...r,
      tipoInfo: TIPOS_RESIDUO.find((t) => t.id === r.tipo) || TIPOS_RESIDUO[0],
      zonaInfo: ZONAS.find((z) => z.id === r.zona) || ZONAS[0],
      foto: r.foto || FOTOS[i % FOTOS.length],
      reportadoPor: r.reportado_por || r.reportadoPor || 'Ciudadanía',
      notasAdmin: r.notas_admin ?? r.notasAdmin ?? '',
      destacado: Boolean(r.destacado),
    }))

    const porZona = ZONAS.map((z) => ({ ...z, total: detalle.filter((r) => r.zona === z.id).length })).sort(
      (a, b) => b.total - a.total,
    )
    const porTipo = TIPOS_RESIDUO.map((t) => ({ ...t, total: detalle.filter((r) => r.tipo === t.id).length })).sort(
      (a, b) => b.total - a.total,
    )
    const porEstado = ['pendiente', 'verificado', 'jornada', 'resuelto'].map((e) => ({
      estado: e,
      total: detalle.filter((r) => r.estado === e).length,
    }))
    const kgTotal = detalle.reduce((s, r) => s + (Number(r.kg) || 0), 0)
    const resueltos = detalle.filter((r) => r.estado === 'resuelto').length
    const porcentajeResuelto = detalle.length ? Math.round((resueltos / detalle.length) * 100) : 0

    return {
      reportes: detalle,
      porZona,
      porTipo,
      porEstado,
      kgTotal,
      resueltos,
      porcentajeResuelto,
      origen,
      total: detalle.length,
      refrescar: cargar,
      crearReporte,
      actualizarReporte,
      cambiarEstado,
      eliminarReporte,
      restaurarReporte,
    }
  }, [reportes, origen, cargar, crearReporte, actualizarReporte, cambiarEstado, eliminarReporte, restaurarReporte])

  return <ReportesContext.Provider value={valor}>{children}</ReportesContext.Provider>
}

export function useReportes() {
  const ctx = useContext(ReportesContext)
  if (!ctx) throw new Error('useReportes debe usarse dentro de ReportesProvider')
  return ctx
}
