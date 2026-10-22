# Marea Azul — Prototipo web interactivo

Sistema de información para el monitoreo y la gestión de residuos sólidos en ambientes marino-costeros, alineado con la **Meta 14.1** del **Objetivo de Desarrollo Sostenible 14 (Vida Submarina)**. Universidad Cooperativa de Colombia, Sede Montería, Córdoba.

## Características principales

- **Inicio interactivo** con héroe con imagen real, secciones editables desde el panel y animaciones.
- **Acceso con dos roles**: _Ciudadano_ (registro / inicio de sesión) y _Administrador_.
- **Mapa real 2D/3D** con [MapLibre GL](https://maplibre.org/). Selección de zona afectada, mapa de calor, relieve tridimensional, marcadores con evidencia fotográfica.
- **Reporte ciudadano** (RF-01): ubicación real, tipo de residuo, volumen estimado, descripción, foto comprimida. Al enviar se genera un **correo inmediato** en la bandeja del administrador.
- **Panel administrativo ampliado** (RF-03): Resumen, Reportes (edición inline, cambio de estado, CSV), **Correos** (bandeja con polling), Usuarios, **Contenido** (textos/colores/secciones en vivo), Ajustes, exportación JSON.
- **Indicadores** (RF-04): Muchas gráficas (barras, columnas, apiladas, dona, línea doble, matriz zona×tipo, Gantt, sparklines, metas ODS 14).
- **Base de datos SQLite** (`server/data/marea.db`), API REST con Express, sesiones con token.
- **Todo en una sola carpeta**, listo para abrir en **Visual Studio Code**.
- **Tema azul sostenible** (configurable desde el panel).

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Vite 6, React Router 7, Framer Motion, Lucide React, MapLibre GL |
| Backend | Node.js, Express 5, better-sqlite3, bcryptjs, uuid |
| Datos | SQLite (marea.db) + datos semilla compartidos (`src/data/mock.js`) |

## Requisitos

- [Node.js](https://nodejs.org/) 18+ (probado con Node 22)
- Navegador moderno

## Instalación y ejecución

Desde la raíz del proyecto (`Proyecto/`):

```bash
# Instalar dependencias
npm install

# Desarrollo: API (http://localhost:3001) + Vite (http://localhost:5173)
npm run dev

# Producción: compilar frontend y servir API + dist
npm run build
npm start
```

La app abre en `http://localhost:5173` en desarrollo. El frontend proxy hacia `/api` en el puerto 3001.

## Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@mareazul.co` | `admin123` |
| Ciudadano | `maria@comunidad.co` | `ciudadano123` |
| Ciudadano | `comite@sananton.co` | `ciudadano123` |

En `/acceso` también hay botones de **autocompletar** para probar rápidamente. Si el servidor no está disponible, el sistema entra en **modo local** (datos en `localStorage`).

## Estructura del proyecto

```text
Proyecto/
├── server/           # API Express + SQLite (db.js, index.js)
│   ├── data/         # marea.db (ignorado por Git)
│   └── ...
├── src/
│   ├── components/   # Navbar, Footer, MapaGL, IconoTipo, PageWrapper
│   ├── pages/        # Inicio, Mapa, Reportar, Indicadores, Panel, Acceso
│   ├── store/        # AuthContext, ReportesContext, AjustesContext
│   ├── data/mock.js  # Datos semilla compartidos
│   ├── api.js        # Cliente HTTP
│   └── index.css     # Sistema de diseño + estilos
├── public/img/       # Imágenes reales (Wikimedia Commons)
└── vite.config.js
```

## Base de datos

La base de datos se crea automáticamente en `server/data/marea.db` al arrancar el servidor (`npm run dev`). Se incluyen tablas: `usuarios`, `reportes`, `sesiones`, `emails`, `ajustes`. Los datos se inicializan desde `src/data/mock.js`.

## Correo (simulado)

Al crear un reporte o registrar un usuario, el sistema inserta un registro en la tabla `emails`. La **bandeja de correos** está en el **Panel → Correos** con actualización automática. En esta versión los correos se guardan en SQLite (no se envían por SMTP). Para envío real bastaría con conectar un proveedor SMTP en `server/index.js`.

## Imágenes

Las fotos incluidas en `public/img/` son de [Wikimedia Commons](https://commons.wikimedia.org/) con fines exclusivamente académicos/demostrativos para este prototipo de trabajo de grado.

## Repositorio Git

Este proyecto incluye un repositorio **Git local**. Para subirlo a GitHub:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

Se recomienda **no** subir `server/data/` ni `node_modules/` (ya incluidos en `.gitignore`).

## Notas

- El mapa usa **MapLibre GL** con el estilo `https://tiles.openfreemap.org/styles/liberty` y relieve **AWS Terrarium** para la vista 3D. No requiere API keys.
- Los IDs de reporte se generan como `R-XXXX`.
- El botón **2D/3D** del mapa permite alternar relieve, inclinación y cielo.
- En el panel se puede editar contenido, colores, banner y exportar un respaldo JSON.
- El selector **Zona afectada** resalta la zona en el mapa y centra la vista.
