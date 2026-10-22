/* ============================================================
   Marea Verde — API REST (Express + SQLite)
   Puerto 3001 · en producción también sirve dist/
   ============================================================ */
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, q, hashPassword, verificarPassword, nuevoToken, AJUSTES_POR_DEFECTO } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUERTO = process.env.PORT || 3001
const app = express()

app.use(express.json({ limit: '2mb' }))

/* CORS simple por si se abre el puerto directamente */
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

/* ---------------- Auth ---------------- */
function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Sesión requerida' })
  const sesion = q.sesion.get(token)
  if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' })
  if (!sesion.activo) return res.status(403).json({ error: 'Usuario bloqueado' })
  req.usuario = sesion
  req.token = token
  next()
}

function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') return res.status(403).json({ error: 'Requiere rol administrador' })
  next()
}

const ajustes = () =>
  Object.fromEntries(q.ajustesTodos.all().map((a) => [a.clave, a.valor]))

app.post('/api/auth/registro', (req, res) => {
  const { nombre, email, password } = req.body || {}
  if (!nombre?.trim() || !email?.trim() || !password)
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' })
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Correo no válido' })
  if (String(password).length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  if (q.usuarioPorEmail.get(email.trim().toLowerCase()))
    return res.status(409).json({ error: 'Ese correo ya está registrado' })

  const info = q.crearUsuario.run({
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    password: hashPassword(password),
    rol: 'ciudadano',
  })
  const usuario = q.usuarioPorId.get(info.lastInsertRowid)
  const token = nuevoToken()
  q.crearSesion.run(token, usuario.id)

  // Correo de bienvenida (simulado) → bandeja
  const a = ajustes()
  q.crearEmail.run({
    para: usuario.email,
    de: a.contacto_email,
    asunto: 'Bienvenido a Marea Verde — cuenta ciudadana activada',
    cuerpo: `Hola ${usuario.nombre}:\n\nTu cuenta ciudadana fue creada correctamente. Ya puedes reportar puntos de acumulación de residuos en la costa de Córdoba.\n\nEste es un correo automático de demostración del sistema Marea Verde (ODS 14).`,
    reporte_id: null,
    tipo: 'bienvenida',
  })

  res.status(201).json({ usuario, token })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  const registro = email ? q.usuarioPorEmail.get(String(email).trim().toLowerCase()) : null
  if (!registro || !verificarPassword(password || '', registro.password))
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
  if (!registro.activo) return res.status(403).json({ error: 'Usuario bloqueado por el administrador' })

  const token = nuevoToken()
  q.crearSesion.run(token, registro.id)
  const { id, nombre, email: mail, rol } = registro
  res.json({ usuario: { id, nombre, email: mail, rol }, token })
})

app.post('/api/auth/logout', auth, (req, res) => {
  q.cerrarSesion.run(req.token)
  res.json({ ok: true })
})

app.get('/api/auth/me', auth, (req, res) => res.json({ usuario: req.usuario }))

/* ---------------- Reportes ---------------- */
function cargarAjustes() {
  return ajustes()
}

app.get('/api/reportes', (req, res) => {
  res.json(q.reportesTodos.all())
})

app.post('/api/reportes', auth, (req, res) => {
  const { tipo, zona, lat, lng, kg, descripcion, direccion, reportadoPor } = req.body || {}
  if (typeof lat !== 'number' || typeof lng !== 'number')
    return res.status(400).json({ error: 'La ubicación (lat/lng) es obligatoria' })
  if (!tipo) return res.status(400).json({ error: 'El tipo de residuo es obligatorio' })
  if (!descripcion || String(descripcion).trim().length < 10)
    return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' })

  const a = cargarAjustes()
  const n = q.siguienteId.get().n
  const id = `R-${1042 + n}`
  const hoy = new Date()

  const reporte = {
    id,
    tipo,
    zona: zona || 'monteria',
    lat,
    lng,
    fecha: hoy.toISOString().slice(0, 10),
    estado: 'pendiente',
    kg: Number(kg) || 0,
    descripcion: String(descripcion).trim(),
    direccion: String(direccion || '').slice(0, 200),
    reportado_por: String(reportadoPor || req.usuario.nombre || 'Ciudadanía').slice(0, 80),
    usuario_id: req.usuario.id,
    mes: hoy.getMonth() + 1,
    foto: String(req.body.foto || '').slice(0, 300),
  }

  q.crearReporte.run(reporte)

  /* ===== CORREO INMEDIATO al administrador (simulado) ===== */
  const email = q.crearEmail.run({
    para: a.contacto_email,
    de: req.usuario.email,
    asunto: `Nuevo reporte ${id} · ${tipo} · ${zona}`,
    cuerpo:
      `Se recibió un nuevo reporte de residuos:\n\n` +
      `Código: ${id}\n` +
      `Tipo: ${tipo}\n` +
      `Zona: ${zona}\n` +
      `Ubicación: ${lat.toFixed(5)}, ${lng.toFixed(5)}${direccion ? ` (${direccion})` : ''}\n` +
      `Volumen estimado: ${reporte.kg} kg\n` +
      `Reportado por: ${reporte.reportado_por}\n\n` +
      `${reporte.descripcion}\n\n` +
      `Estado inicial: pendiente de verificación.`,
    reporte_id: id,
    tipo: 'reporte',
  })

  res.status(201).json({
    reporte,
    email: { id: email.lastInsertRowid, para: a.contacto_email, inmediato: true },
  })
})

app.patch('/api/reportes/:id', auth, soloAdmin, (req, res) => {
  const actual = q.reportePorId.get(req.params.id)
  if (!actual) return res.status(404).json({ error: 'Reporte no encontrado' })
  const b = req.body || {}
  q.actualizarReporte.run({
    id: actual.id,
    tipo: b.tipo ?? actual.tipo,
    zona: b.zona ?? actual.zona,
    kg: b.kg ?? actual.kg,
    estado: b.estado ?? actual.estado,
    descripcion: b.descripcion ?? actual.descripcion,
    direccion: b.direccion ?? actual.direccion,
    notas_admin: b.notas_admin ?? actual.notas_admin,
    destacado: b.destacado ?? actual.destacado,
    eliminado: b.eliminado ?? actual.eliminado ?? 0,
  })
  res.json(q.reportePorId.get(actual.id))
})

app.delete('/api/reportes/:id', auth, soloAdmin, (req, res) => {
  const actual = q.reportePorId.get(req.params.id)
  if (!actual) return res.status(404).json({ error: 'Reporte no encontrado' })
  q.eliminarReporte.run(req.params.id)
  res.json({ ok: true, eliminado: req.params.id })
})

/* ---------------- Correos (bandeja administrativa) ---------------- */
app.get('/api/emails', auth, soloAdmin, (req, res) => {
  res.json({ correos: q.emailsTodos.all(), noLeidos: q.emailsNoLeidos.get().n })
})

app.patch('/api/emails/:id', auth, soloAdmin, (req, res) => {
  const mail = q.emailPorId.get(req.params.id)
  if (!mail) return res.status(404).json({ error: 'Correo no encontrado' })
  const leido = req.body?.leido === undefined ? 1 : req.body.leido ? 1 : 0
  q.marcarEmail.run(leido, mail.id)
  res.json({ ...mail, leido })
})

/* ---------------- Usuarios ---------------- */
app.get('/api/usuarios', auth, soloAdmin, (req, res) => {
  res.json(q.usuariosTodos.all())
})

app.patch('/api/usuarios/:id', auth, soloAdmin, (req, res) => {
  const u = q.usuarioPorId.get(req.params.id)
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' })
  if (u.id === req.usuario.id && req.body?.activo === false)
    return res.status(400).json({ error: 'No puedes bloquearte a ti mismo' })
  const rol = req.body?.rol === 'admin' || req.body?.rol === 'ciudadano' ? req.body.rol : u.rol
  const activo = req.body?.activo === undefined ? u.activo : req.body.activo ? 1 : 0
  q.actualizarUsuario.run(activo, rol, u.id)
  res.json(q.usuarioPorId.get(u.id))
})

/* ---------------- Ajustes del sitio ---------------- */
app.get('/api/ajustes', (req, res) => res.json(ajustes()))

app.put('/api/ajustes', auth, soloAdmin, (req, res) => {
  const permitidas = Object.keys(AJUSTES_POR_DEFECTO)
  const b = req.body || {}
  const tx = db.transaction(() => {
    for (const clave of permitidas) {
      if (b[clave] !== undefined) q.guardarAjuste.run(clave, String(b[clave]))
    }
  })
  tx()
  res.json(ajustes())
})

/* ---------------- Salud ---------------- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, base: 'sqlite', hora: new Date().toISOString() })
})

/* ---------------- Estáticos (producción) ---------------- */
const dist = path.join(__dirname, '..', 'dist')
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PUERTO, () => {
  console.log(`API Marea Verde · SQLite → http://localhost:${PUERTO}/api/health`)
})
