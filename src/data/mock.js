/* ============================================================
   Datos compartidos: tipos, zonas, estados, cronograma
   Importado por el cliente (React) y por el servidor (seed)
   ============================================================ */

export const TIPOS_RESIDUO = [
  { id: 'plastico', nombre: 'Plástico', icono: 'cupo', color: '#22c55e' },
  { id: 'vidrio', nombre: 'Vidrio', icono: 'botella', color: '#0ea5e9' },
  { id: 'metal', nombre: 'Metal', icono: 'lata', color: '#f59e0b' },
  { id: 'organico', nombre: 'Orgánico', icono: 'hoja', color: '#84cc16' },
  { id: 'papel', nombre: 'Papel / Cartón', icono: 'caja', color: '#a16207' },
  { id: 'redes', nombre: 'Redes de pesca', icono: 'red', color: '#8b5cf6' },
  { id: 'otro', nombre: 'Otro', icono: 'basura', color: '#64748b' },
]

export const ESTADOS = {
  pendiente: { id: 'pendiente', nombre: 'Pendiente', clase: 'badge-pendiente' },
  verificado: { id: 'verificado', nombre: 'Verificado', clase: 'badge-verificado' },
  jornada: { id: 'jornada', nombre: 'En jornada', clase: 'badge-jornada' },
  resuelto: { id: 'resuelto', nombre: 'Resuelto', clase: 'badge-resuelto' },
}

export const FLUJO_ESTADOS = ['pendiente', 'verificado', 'jornada', 'resuelto']

export const ZONAS = [
  { id: 'monteria', nombre: 'Montería – Río Sinú', lat: 8.7479, lng: -75.8818 },
  { id: 'san-anton', nombre: 'San Antón – Los Patios', lat: 8.6465, lng: -75.7564 },
  { id: 'los-patios', nombre: 'Los Patios – La Caimanera', lat: 8.6651, lng: -75.7352 },
  { id: 'lorica', nombre: 'Lorica – Corozal', lat: 8.6788, lng: -75.6601 },
  { id: 'puerto-escondido', nombre: 'Puerto Escondido', lat: 8.7935, lng: -75.6623 },
  { id: 'purisima', nombre: 'Purísima', lat: 8.7761, lng: -75.7146 },
  { id: 'san-pelayo', nombre: 'San Pelayo – Canal', lat: 8.7143, lng: -75.7069 },
  { id: 'canalete', nombre: 'Canalete', lat: 8.7876, lng: -75.7636 },
]

export const REPORTES_INICIALES = [
  {
    id: 'R-1041', tipo: 'plastico', zona: 'san-anton', lat: 8.6482, lng: -75.7531,
    fecha: '2026-10-18', estado: 'pendiente', kg: 85, mes: 10,
    descripcion: 'Acumulación de botellas y bolsas plásticas arrastradas por la marea sobre la franja arenosa.',
    reportadoPor: 'Ciudadanía', foto: '/img/evidencia-1.jpg',
  },
  {
    id: 'R-1040', tipo: 'redes', zona: 'lorica', lat: 8.6812, lng: -75.6645,
    fecha: '2026-10-16', estado: 'verificado', kg: 130, mes: 10,
    descripcion: 'Redes y cabos de pesca abandonados atrapados en las raíces del manglar de Corozal.',
    reportadoPor: 'Pescador artesanal', foto: '/img/evidencia-2.jpg',
  },
  {
    id: 'R-1039', tipo: 'plastico', zona: 'los-patios', lat: 8.6679, lng: -75.7318,
    fecha: '2026-10-14', estado: 'jornada', kg: 64, mes: 10,
    descripcion: 'Espuma de poliestireno y envases de alimentos dispersos en el canal de La Caimanera.',
    reportadoPor: 'Ciudadanía', foto: '/img/evidencia-3.jpg',
  },
  {
    id: 'R-1038', tipo: 'vidrio', zona: 'monteria', lat: 8.7512, lng: -75.8764,
    fecha: '2026-10-11', estado: 'resuelto', kg: 42, mes: 10,
    descripcion: 'Frascos de vidrio rotos junto a la orilla del río Sinú tras la crecida.',
    reportadoPor: 'Organización comunitaria', foto: '/img/problema-residuos.jpg',
  },
  {
    id: 'R-1037', tipo: 'metal', zona: 'puerto-escondido', lat: 8.7958, lng: -75.6591,
    fecha: '2026-10-05', estado: 'pendiente', kg: 55, mes: 10,
    descripcion: 'Latas y chatarra depositados en el área de desembarco de embarcaciones.',
    reportadoPor: 'Ciudadanía', foto: '/img/problema-plastico.jpg',
  },
  {
    id: 'R-1036', tipo: 'papel', zona: 'purisima', lat: 8.7784, lng: -75.7112,
    fecha: '2026-09-27', estado: 'resuelto', kg: 30, mes: 9,
    descripcion: 'Cartones y residuos de empaque arrastrados desde los caños hacia la ciénaga.',
    reportadoPor: 'Ciudadanía', foto: '/img/evidencia-2.jpg',
  },
  {
    id: 'R-1035', tipo: 'plastico', zona: 'san-pelayo', lat: 8.7165, lng: -75.7034,
    fecha: '2026-09-21', estado: 'resuelto', kg: 98, mes: 9,
    descripcion: 'Gran concentración de plásticos de un solo uso en el canal del siete.',
    reportadoPor: 'Autoridad ambiental', foto: '/img/problema-plastico.jpg',
  },
  {
    id: 'R-1034', tipo: 'organico', zona: 'canalete', lat: 8.7899, lng: -75.7601,
    fecha: '2026-09-12', estado: 'verificado', kg: 75, mes: 9,
    descripcion: 'Restos de cosecha y materia orgánica acumulada en la desembocadura.',
    reportadoPor: 'Ciudadanía', foto: '/img/evidencia-1.jpg',
  },
  {
    id: 'R-1033', tipo: 'redes', zona: 'san-anton', lat: 8.6441, lng: -75.7602,
    fecha: '2026-09-03', estado: 'resuelto', kg: 150, mes: 9,
    descripcion: 'Redes fantasma retiradas con apoyo de la comunidad pesquera.',
    reportadoPor: 'Pescador artesanal', foto: '/img/evidencia-2.jpg',
  },
  {
    id: 'R-1032', tipo: 'plastico', zona: 'lorica', lat: 8.6755, lng: -75.6572,
    fecha: '2026-08-24', estado: 'resuelto', kg: 112, mes: 8,
    descripcion: 'Bolsas y envolturas plásticas sobre el manglar de Corozal.',
    reportadoPor: 'Ciudadanía', foto: '/img/problema-residuos.jpg',
  },
  {
    id: 'R-1031', tipo: 'vidrio', zona: 'los-patios', lat: 8.6632, lng: -75.7395,
    fecha: '2026-08-15', estado: 'resuelto', kg: 38, mes: 8,
    descripcion: 'Botellas de vidrio en el acceso a la playa.',
    reportadoPor: 'Ciudadanía', foto: '/img/evidencia-3.jpg',
  },
  {
    id: 'R-1030', tipo: 'metal', zona: 'monteria', lat: 8.7445, lng: -75.8872,
    fecha: '2026-08-06', estado: 'resuelto', kg: 61, mes: 8,
    descripcion: 'Neumáticos y hierros abandonados en la ribera del río.',
    reportadoPor: 'Organización comunitaria', foto: '/img/evidencia-1.jpg',
  },
  {
    id: 'R-1029', tipo: 'plastico', zona: 'purisima', lat: 8.7742, lng: -75.7188,
    fecha: '2026-07-25', estado: 'resuelto', kg: 87, mes: 7,
    descripcion: 'Residuos plásticos acumulados tras las lluvias del invierno cordobés.',
    reportadoPor: 'Ciudadanía', foto: '/img/problema-plastico.jpg',
  },
  {
    id: 'R-1028', tipo: 'otro', zona: 'puerto-escondido', lat: 8.7912, lng: -75.6668,
    fecha: '2026-07-14', estado: 'resuelto', kg: 46, mes: 7,
    descripcion: 'Enseres domiciliarios abandonados en el borde costero.',
    reportadoPor: 'Ciudadanía', foto: '/img/evidencia-2.jpg',
  },
  {
    id: 'R-1027', tipo: 'plastico', zona: 'canalete', lat: 8.7851, lng: -75.7674,
    fecha: '2026-06-28', estado: 'resuelto', kg: 70, mes: 6,
    descripcion: 'Envases de plástico en el estuario tras la bajamar.',
    reportadoPor: 'Autoridad ambiental', foto: '/img/evidencia-3.jpg',
  },
  {
    id: 'R-1026', tipo: 'redes', zona: 'san-pelayo', lat: 8.7119, lng: -75.7118,
    fecha: '2026-06-10', estado: 'resuelto', kg: 125, mes: 6,
    descripcion: 'Redes de pesca retiradas en jornada comunitaria.',
    reportadoPor: 'Pescador artesanal', foto: '/img/problema-jornada.jpg',
  },
]

export const MESES = [
  { mes: 6, nombre: 'Jun' },
  { mes: 7, nombre: 'Jul' },
  { mes: 8, nombre: 'Ago' },
  { mes: 9, nombre: 'Sep' },
  { mes: 10, nombre: 'Oct' },
]

/** Cronograma del anteproyecto (5 meses) para el gráfico Gantt */
export const CRONOGRAMA = [
  { actividad: 'Formulación y anteproyecto', meses: [1] },
  { actividad: 'Análisis y especificación de requisitos', meses: [1, 2] },
  { actividad: 'Diseño de arquitectura y base de datos', meses: [2, 3] },
  { actividad: 'Desarrollo de módulos del sistema', meses: [3, 4] },
  { actividad: 'Pruebas y validación', meses: [4, 5] },
  { actividad: 'Documentación final y sustentación', meses: [5] },
]

export const REQUISITOS = [
  { codigo: 'RF-01', desc: 'Registro de reportes con ubicación, tipo de residuo y evidencia fotográfica.', prio: 'Alta' },
  { codigo: 'RF-02', desc: 'Geolocalización automática y visualización en mapa interactivo 2D/3D.', prio: 'Alta' },
  { codigo: 'RF-03', desc: 'Verificación, clasificación y actualización de estado por administradores.', prio: 'Alta' },
  { codigo: 'RF-04', desc: 'Generación de indicadores básicos por periodo de tiempo.', prio: 'Media' },
  { codigo: 'RF-05', desc: 'Consulta pública del histórico de reportes y su estado.', prio: 'Media' },
  { codigo: 'RF-06', desc: 'Autenticación de usuarios administrativos y ciudadanos.', prio: 'Alta' },
]

/** Fotos reales disponibles en /img (Wikimedia Commons) */
export const FOTOS = [
  '/img/hero-playa.jpg',
  '/img/problema-residuos.jpg',
  '/img/problema-plastico.jpg',
  '/img/problema-jornada.jpg',
  '/img/ods-tortuga.jpg',
  '/img/evidencia-1.jpg',
  '/img/evidencia-2.jpg',
  '/img/evidencia-3.jpg',
  '/img/jornada-educacion.jpg',
]
