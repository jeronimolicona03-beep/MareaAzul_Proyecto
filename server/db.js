/* ============================================================
   Marea Verde — Capa de datos (SQLite con better-sqlite3)
   Base de datos real en archivo: server/data/marea.db
   ============================================================ */
import Database from 'better-sqlite3'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { REPORTES_INICIALES } from '../src/data/mock.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

export const db = new Database(path.join(dataDir, 'marea.db'))
db.pragma('journal_mode = WAL')

/* ---------------- Esquema ---------------- */
db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'ciudadano',
  activo INTEGER NOT NULL DEFAULT 1,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  token TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creada TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reportes (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  zona TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  fecha TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  kg INTEGER NOT NULL DEFAULT 0,
  descripcion TEXT NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  reportado_por TEXT NOT NULL DEFAULT 'Ciudadanía',
  usuario_id INTEGER,
  mes INTEGER NOT NULL DEFAULT 1,
  notas_admin TEXT NOT NULL DEFAULT '',
  destacado INTEGER NOT NULL DEFAULT 0,
  foto TEXT NOT NULL DEFAULT '',
  eliminado INTEGER NOT NULL DEFAULT 0,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  para TEXT NOT NULL,
  de TEXT NOT NULL,
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  reporte_id TEXT,
  tipo TEXT NOT NULL DEFAULT 'reporte',
  leido INTEGER NOT NULL DEFAULT 0,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
`)

/* ---------------- Utilidades ---------------- */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verificarPassword(password, guardado) {
  const [salt, hash] = String(guardado).split(':')
  if (!salt || !hash) return false
  const intento = crypto.scryptSync(String(password), salt, 32).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(intento, 'hex'))
}

export const nuevoToken = () => crypto.randomBytes(32).toString('hex')

export const AJUSTES_POR_DEFECTO = {
  nombre_sitio: 'Marea Verde',
  contacto_email: 'contacto@mareaverde.co',
  contacto_telefono: '+57 (604) 782 0000',
  hero_titulo: 'Cuida la costa, reporta el residuo.',
  hero_subtitulo:
    'Sistema de información para el monitoreo y la gestión de residuos sólidos en ambientes marino-costeros del departamento de Córdoba. Reporta, geolocaliza y da seguimiento a los puntos críticos de acumulación de residuos.',
  cta_titulo: 'Tu reporte puede cambiar una costa',
  cta_texto:
    'Únete a la ciencia ciudadana: cada punto que marcas ayuda a priorizar las jornadas de limpieza y al cumplimiento de la meta 14.1 del ODS 14.',
  banner_activo: '0',
  banner_texto: 'Prototipo en fase de pruebas — los datos mostrados son de demostración.',
  secciones_visibles: 'problema,como,modulos,requisitos,cta',
  tema_primario: '#15803d',
  tema_acento: '#a3e635',
  mantenimiento: '0',
  umbral_alerta_kg: '150',
}

/* Compatibilidad con bases de datos creadas antes de agregar estas columnas */
try { db.exec(`ALTER TABLE reportes ADD COLUMN foto TEXT NOT NULL DEFAULT ''`) } catch { /* ya existe */ }
try { db.exec(`ALTER TABLE reportes ADD COLUMN eliminado INTEGER NOT NULL DEFAULT 0`) } catch { /* ya existe */ }

/* ---------------- Semilla ---------------- */
function sembrar() {
  const hayAdmin = db.prepare(`SELECT COUNT(*) n FROM usuarios WHERE rol='admin'`).get().n
  if (!hayAdmin) {
    const insert = db.prepare(
      `INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`,
    )
    insert.run('Administrador Marea Verde', 'admin@mareaverde.co', hashPassword('admin123'), 'admin')
    insert.run('María Pescadora', 'maria@comunidad.co', hashPassword('ciudadano123'), 'ciudadano')
    insert.run('Comité de Playas', 'comite@sananton.co', hashPassword('ciudadano123'), 'ciudadano')
  }

  const hayReportes = db.prepare(`SELECT COUNT(*) n FROM reportes`).get().n
  if (!hayReportes) {
    const insert = db.prepare(`
      INSERT INTO reportes (id, tipo, zona, lat, lng, fecha, estado, kg, descripcion, reportado_por, mes, foto)
      VALUES (@id, @tipo, @zona, @lat, @lng, @fecha, @estado, @kg, @descripcion, @reportadoPor, @mes, @foto)
    `)
    const tx = db.transaction((items) => items.forEach((r) => insert.run(r)))
    tx(REPORTES_INICIALES)
  }

  const hayAjustes = db.prepare(`SELECT COUNT(*) n FROM ajustes`).get().n
  if (!hayAjustes) {
    const insert = db.prepare(`INSERT INTO ajustes (clave, valor) VALUES (?, ?)`)
    const tx = db.transaction((obj) => Object.entries(obj).forEach(([k, v]) => insert.run(k, v)))
    tx(AJUSTES_POR_DEFECTO)

    const insertMail = db.prepare(
      `INSERT INTO emails (para, de, asunto, cuerpo, reporte_id, tipo, leido) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    insertMail.run(
      AJUSTES_POR_DEFECTO.contacto_email,
      'sistema@mareaverde.co',
      'Bienvenido a Marea Verde',
      'Sistema notificador listo. Los nuevos reportes llegarán a esta bandeja de forma inmediata.',
      null,
      'sistema',
      1,
    )
  }
}
sembrar()

/* ---------------- Consultas reutilizables ---------------- */
export const q = {
  usuarioPorEmail: db.prepare(`SELECT * FROM usuarios WHERE email = ?`),
  usuarioPorId: db.prepare(`SELECT id, nombre, email, rol, activo, creado FROM usuarios WHERE id = ?`),
  usuariosTodos: db.prepare(`SELECT id, nombre, email, rol, activo, creado FROM usuarios ORDER BY creado DESC`),
  crearUsuario: db.prepare(`INSERT INTO usuarios (nombre, email, password, rol) VALUES (@nombre, @email, @password, @rol)`),
  crearSesion: db.prepare(`INSERT INTO sesiones (token, usuario_id) VALUES (?, ?)`),
  sesion: db.prepare(`SELECT s.token, u.id, u.nombre, u.email, u.rol, u.activo FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ?`),
  cerrarSesion: db.prepare(`DELETE FROM sesiones WHERE token = ?`),

  reportesTodos: db.prepare(`SELECT * FROM reportes WHERE eliminado = 0 ORDER BY creado DESC`),
  reportePorId: db.prepare(`SELECT * FROM reportes WHERE id = ?`),
  crearReporte: db.prepare(`
    INSERT INTO reportes (id, tipo, zona, lat, lng, fecha, estado, kg, descripcion, direccion, reportado_por, usuario_id, mes)
    VALUES (@id, @tipo, @zona, @lat, @lng, @fecha, @estado, @kg, @descripcion, @direccion, @reportado_por, @usuario_id, @mes)
  `),
  actualizarReporte: db.prepare(`
    UPDATE reportes SET tipo=@tipo, zona=@zona, kg=@kg, estado=@estado, descripcion=@descripcion,
      direccion=@direccion, notas_admin=@notas_admin, destacado=@destacado, eliminado=@eliminado WHERE id=@id
  `),
  eliminarReporte: db.prepare(`UPDATE reportes SET eliminado = 1 WHERE id = ?`),
  siguienteId: db.prepare(`SELECT COUNT(*) n FROM reportes`),

  emailsTodos: db.prepare(`SELECT * FROM emails ORDER BY datetime(creado) DESC, id DESC`),
  emailPorId: db.prepare(`SELECT * FROM emails WHERE id = ?`),
  marcarEmail: db.prepare(`UPDATE emails SET leido = ? WHERE id = ?`),
  crearEmail: db.prepare(
    `INSERT INTO emails (para, de, asunto, cuerpo, reporte_id, tipo) VALUES (@para, @de, @asunto, @cuerpo, @reporte_id, @tipo)`,
  ),
  emailsNoLeidos: db.prepare(`SELECT COUNT(*) n FROM emails WHERE leido = 0`),

  ajustesTodos: db.prepare(`SELECT clave, valor FROM ajustes`),
  guardarAjuste: db.prepare(`INSERT INTO ajustes (clave, valor) VALUES (?, ?)
    ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`),

  actualizarUsuario: db.prepare(`UPDATE usuarios SET activo = ?, rol = ? WHERE id = ?`),
}
