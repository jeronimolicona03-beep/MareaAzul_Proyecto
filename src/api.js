/* ============================================================
   Cliente HTTP de la API Marea Verde
   ============================================================ */

const CLAVE_TOKEN = 'mv-token'

export const getToken = () => {
  try { return localStorage.getItem(CLAVE_TOKEN) } catch { return null }
}
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(CLAVE_TOKEN, t)
    else localStorage.removeItem(CLAVE_TOKEN)
  } catch { /* modo privado */ }
}

let _disponible = null // null = sin consultar, true/false

export const apiDisponible = () => _disponible

async function pedir(ruta, opciones = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opciones.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${ruta}`, { ...opciones, headers })
  const datos = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(datos.error || `Error ${res.status}`)
  return datos
}

/** Comprueba una sola vez si el servidor está activo */
export async function verificarServidor() {
  if (_disponible !== null) return _disponible
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch('/api/health', { signal: ctrl.signal })
    clearTimeout(t)
    _disponible = res.ok
  } catch {
    _disponible = false
  }
  return _disponible
}

export const api = {
  registro: (datos) => pedir('/auth/registro', { method: 'POST', body: JSON.stringify(datos) }),
  login: (datos) => pedir('/auth/login', { method: 'POST', body: JSON.stringify(datos) }),
  logout: () => pedir('/auth/logout', { method: 'POST' }),
  yo: () => pedir('/auth/me'),

  reportes: () => pedir('/reportes'),
  crearReporte: (datos) => pedir('/reportes', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarReporte: (id, datos) => pedir(`/reportes/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  eliminarReporte: (id) => pedir(`/reportes/${id}`, { method: 'DELETE' }),

  emails: () => pedir('/emails'),
  marcarEmail: (id, leido) => pedir(`/emails/${id}`, { method: 'PATCH', body: JSON.stringify({ leido }) }),

  usuarios: () => pedir('/usuarios'),
  actualizarUsuario: (id, datos) => pedir(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(datos) }),

  ajustes: () => pedir('/ajustes'),
  guardarAjustes: (datos) => pedir('/ajustes', { method: 'PUT', body: JSON.stringify(datos) }),
}
