import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Box, Map as MapIcon, Layers } from 'lucide-react'
import { ESTADOS, ZONAS } from '../data/mock.js'

/* Iconos SVG por tipo de residuo (sin emojis) */
const SVG_TIPO = {
  plastico: '<path d="M8 2h8M9 2v3l-2 3v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8l-2-3V2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  vidrio: '<path d="M8 2h8M9 2v4l-2 4v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V10l-2-4V2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  metal: '<rect x="7" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 8h10M7 16h10" stroke="currentColor" stroke-width="2"/>',
  organico: '<path d="M12 21c0-6 3-12 9-14-1 8-4 12-9 14Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 21C6 19 4 13 4 7c5 2 8 7 8 14Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  papel: '<path d="M3 8l9-5 9 5v9l-9 5-9-5V8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 8l9 5 9-5M12 13v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  redes: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" stroke="currentColor" stroke-width="1.5"/>',
  otro: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
}

const estiloBase = 'https://tiles.openfreemap.org/styles/liberty'

function pinHTML(r) {
  const est = ESTADOS[r.estado] || ESTADOS.pendiente
  const svg = SVG_TIPO[r.tipo] || SVG_TIPO.otro
  return `<div class="gl-pin est-${r.estado}">
    <span class="gl-pin-onda"></span>
    <span class="gl-pin-bola"><svg viewBox="0 0 24 24" width="14" height="14">${svg}</svg></span>
    <span class="gl-pin-etiqueta">${est.nombre}</span>
  </div>`
}

function popupHTML(r) {
  const est = ESTADOS[r.estado] || ESTADOS.pendiente
  const fecha = new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  const seg = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
  return `<div class="gl-popup">
    <img class="gl-popup-foto" src="${seg(r.foto)}" alt="Evidencia" onerror="this.style.display='none'"/>
    <div class="gl-popup-titulo">${r.id} · ${seg(r.tipoInfo?.nombre)}</div>
    <div class="gl-popup-fila"><span>Zona</span><b>${seg(r.zonaInfo?.nombre)}</b></div>
    ${r.direccion ? `<div class="gl-popup-fila"><span>Ubicación</span><b>${seg(r.direccion)}</b></div>` : ''}
    <div class="gl-popup-fila"><span>Estado</span><b class="gl-estado-${r.estado}">${est.nombre}</b></div>
    <div class="gl-popup-fila"><span>Fecha</span><b>${fecha}</b></div>
    <div class="gl-popup-fila"><span>Volumen est.</span><b>${Number(r.kg) || 0} kg</b></div>
  </div>`
}

/** Círculo geográfico aproximado (sin dependencias) */
function circuloGeo(lng, lat, radioKm = 2.4, puntos = 72) {
  const coords = []
  const R = 6371
  const dl = (radioKm / R) * (180 / Math.PI)
  for (let i = 0; i <= puntos; i++) {
    const t = (i / puntos) * 2 * Math.PI
    const lat2 = lat + dl * Math.sin(t)
    const lng2 = lng + dl / Math.cos((lat * Math.PI) / 180) * Math.cos(t)
    coords.push([lng2, lat2])
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} }
}

/**
 * Mapa real 2D/3D con MapLibre GL.
 * Props:
 *  - reportes: array con reportes enriquecidos (tipoInfo, zonaInfo, foto)
 *  - seleccionable: activa el clic para elegir ubicación (devuelve [lat,lng])
 *  - marcadorSeleccion: [lat,lng] del punto elegido
 *  - zonaResaltada: id de zona a enfatizar
 *  - idSeleccionado: enfoca el reporte
 *  - onSeleccionar: clic en un pin
 *  - modo3DInicial / onModo3D: control del relieve
 */
export default function MapaGL({
  reportes = [],
  alto = 'mapa-altura',
  centro = [-75.75, 8.71],
  zoom = 10,
  seleccionable = false,
  onClicMapa,
  marcadorSeleccion = null,
  zonaResaltada = null,
  idSeleccionado = null,
  onSeleccionar,
  modo3DInicial = false,
  onModo3D,
  mostrarHeatmap = true,
}) {
  const contenedorRef = useRef(null)
  const mapRef = useRef(null)
  const listoRef = useRef(false)
  const markersRef = useRef(new Map())
  const selMarkerRef = useRef(null)
  const refs = useRef({})
  refs.current = { seleccionable, onClicMapa, onSeleccionar, mostrarHeatmap }

  const [modo3D, setModo3D] = useState(modo3DInicial)
  const [cargandoMapa, setCargandoMapa] = useState(true)

  /* ---------- Crear mapa ---------- */
  useEffect(() => {
    if (!contenedorRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: contenedorRef.current,
      style: estiloBase,
      center: centro,
      zoom,
      attributionControl: { compact: true },
      maxPitch: 70,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-left')
    mapRef.current = map

    map.on('load', () => {
      listoRef.current = true
      setCargandoMapa(false)

      // Fuente de reportes + capa de calor
      map.addSource('reportes', { type: 'geojson', data: geoDatos() })
      map.addLayer({
        id: 'capa-heatmap',
        type: 'heatmap',
        source: 'reportes',
        paint: {
          'heatmap-weight': ['match', ['get', 'estado'], 'pendiente', 1.7, 'resuelto', 0.45, 1],
          'heatmap-intensity': 0.95,
          'heatmap-radius': 34,
          'heatmap-opacity': 0.88,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(187,247,208,0)',
            0.2, '#4ade80',
            0.4, '#22c55e',
            0.6, '#f59e0b',
            0.8, '#ef4444',
            1, '#b91c1c',
          ],
        },
      })

      // Fuente y capa para la zona resaltada
      map.addSource('zona-sel', { type: 'geojson', data: vacio() })
      map.addLayer({
        id: 'capa-zona-fill',
        type: 'fill',
        source: 'zona-sel',
        paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.16 },
      })
      map.addLayer({
        id: 'capa-zona-line',
        type: 'line',
        source: 'zona-sel',
        paint: { 'line-color': '#15803d', 'line-width': 2.5, 'line-dasharray': [2, 1.4] },
      })

      sincronizarReportes()
      sincronizarZona()
    })

    map.on('click', (e) => {
      if (refs.current.seleccionable) {
        refs.current.onClicMapa?.([e.lngLat.lat, e.lngLat.lng])
      }
    })

    map.on('error', () => { /* tiles sin red: silencioso */ })

    const onResize = () => map.resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      selMarkerRef.current?.remove()
      map.remove()
      mapRef.current = null
      listoRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function geoDatos() {
    return {
      type: 'FeatureCollection',
      features: reportes.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
        properties: { id: r.id, estado: r.estado, kg: Number(r.kg) || 0 },
      })),
    }
  }
  function vacio() {
    return { type: 'FeatureCollection', features: [] }
  }

  /* ---------- Sincronizar reportes (fuente + pines) ---------- */
  function sincronizarReportes() {
    const map = mapRef.current
    if (!map || !listoRef.current) return
    const fuente = map.getSource('reportes')
    if (fuente) fuente.setData(geoDatos())
    if (refs.current.mostrarHeatmap === false) {
      if (map.getLayer('capa-heatmap')) map.setLayoutProperty('capa-heatmap', 'visibility', 'none')
    }

    // Pines DOM
    const vivos = new Set()
    reportes.forEach((r) => {
      vivos.add(r.id)
      if (markersRef.current.has(r.id)) return

      const el = document.createElement('div')
      el.innerHTML = pinHTML(r)
      el.style.cursor = 'pointer'
      el.title = `${r.id} · ${r.tipoInfo?.nombre || ''}`

      const popup = new maplibregl.Popup({ offset: 26, maxWidth: '280px', className: 'gl-popup-caja' })
        .setHTML(popupHTML(r))

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([r.lng, r.lat])
        .setPopup(popup)
        .addTo(map)

      el.addEventListener('click', () => refs.current.onSeleccionar?.(r.id))
      markersRef.current.set(r.id, marker)
    })

    markersRef.current.forEach((m, id) => {
      if (!vivos.has(id)) { m.remove(); markersRef.current.delete(id) }
    })
  }

  useEffect(() => { sincronizarReportes() }, [reportes])

  /* ---------- Zona resaltada ---------- */
  function sincronizarZona() {
    const map = mapRef.current
    if (!map || !listoRef.current) return
    const fuente = map.getSource('zona-sel')
    if (!fuente) return
    const zona = ZONAS.find((z) => z.id === zonaResaltada)
    if (!zona) { fuente.setData(vacio()); return }
    fuente.setData({ type: 'FeatureCollection', features: [circuloGeo(zona.lng, zona.lat)] })
    map.flyTo({ center: [zona.lng, zona.lat], zoom: 12.2, duration: 1600, essential: true })
  }

  useEffect(() => { sincronizarZona() }, [zonaResaltada])

  /* ---------- Enfocar reporte ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !idSeleccionado) return
    const r = reportes.find((x) => x.id === idSeleccionado)
    if (!r) return
    map.flyTo({ center: [r.lng, r.lat], zoom: 14, duration: 1300, essential: true })
    const marker = markersRef.current.get(r.id)
    if (marker) setTimeout(() => marker.togglePopup(), 1350)
  }, [idSeleccionado])

  /* ---------- Marcador de ubicación elegida ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!marcadorSeleccion) {
      selMarkerRef.current?.remove()
      selMarkerRef.current = null
      return
    }
    const [lat, lng] = marcadorSeleccion
    if (!selMarkerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = `<div class="gl-pin est-verificado gl-pin-sel"><span class="gl-pin-onda"></span><span class="gl-pin-bola">!</span></div>`
      selMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom', draggable: false })
        .setLngLat([lng, lat])
        .addTo(map)
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 1200, essential: true })
    } else {
      selMarkerRef.current.setLngLat([lng, lat])
    }
    if (refs.current.seleccionable && selMarkerRef.current) {
      const m = selMarkerRef.current
      m.onDragEnd?.(() => {}) // sin drag por ahora
    }
  }, [marcadorSeleccion])

  /* ---------- Modo 3D (relieve) ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !listoRef.current) return

    const aplicar = () => {
      if (modo3D) {
        if (!map.getSource('terrain-dem')) {
          map.addSource('terrain-dem', {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 14,
            attribution: 'Elevación: AWS Terrain Tiles',
          })
        }
        map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 })
        if (!map.getLayer('sky')) {
          map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0, 90],
              'sky-atmosphere-sun-intensity': 0.3,
            },
          })
        }
        map.easeTo({ pitch: 62, bearing: -18, duration: 1500, essential: true })
      } else {
        map.setTerrain(null)
        map.easeTo({ pitch: 0, bearing: 0, duration: 1200, essential: true })
      }
    }
    aplicar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo3D, cargandoMapa])

  const alternar3D = () => {
    setModo3D((v) => !v)
    onModo3D?.(!modo3D)
  }

  return (
    <div className={`mapa-envoltura ${alto}`} style={{ position: 'relative' }}>
      <div ref={contenedorRef} style={{ width: '100%', height: '100%' }} />

      {cargandoMapa && (
        <div className="mapa-cargando">
          <Layers size={26} />
          <span>Cargando cartografía real…</span>
        </div>
      )}

      <div className="mapa-controles">
        <button className={`mapa-btn-3d ${modo3D ? 'activo' : ''}`} onClick={alternar3D} type="button" title="Alternar vista 2D / 3D con relieve real">
          {modo3D ? <Box size={16} /> : <MapIcon size={16} />}
          {modo3D ? '3D' : '2D'}
        </button>
        <span className="mapa-leyenda-servicio">OpenFreeMap · MapLibre GL</span>
      </div>

      {mostrarHeatmap && (
        <div className="mapa-calor-leyenda">
          <span>Menor</span>
          <i style={{ background: 'linear-gradient(90deg,#bbf7d0,#22c55e,#f59e0b,#ef4444)' }} />
          <span>Mayor concentración</span>
        </div>
      )}
    </div>
  )
}
