# Guia Para Explicar El Codigo

Esta guia complementa los comentarios agregados dentro del codigo fuente. Sirve para la defensa oral del proyecto.

## Archivos Que No Se Comentaron Linea Por Linea

### `package.json`

Este archivo usa formato JSON. JSON no permite comentarios, por eso no se deben agregar `//` ni `/* */` dentro del archivo porque `npm install` y `npm run dev` podrian fallar.

Explicacion de sus partes:

- `name`: nombre tecnico del proyecto.
- `version`: version del proyecto.
- `description`: descripcion corta.
- `main`: archivo principal del backend.
- `scripts.dev`: comando que ejecuta el servidor con `nodemon`.
- `scripts.start`: comando que ejecuta el servidor con Node normal.
- `dependencies`: librerias necesarias en produccion.
- `devDependencies`: herramientas de desarrollo.

Dependencias principales:

- `express`: framework backend para crear rutas REST.
- `oracledb`: libreria oficial para conectar Node.js con Oracle.
- `dotenv`: permite leer variables del archivo `.env`.
- `cors`: habilita peticiones HTTP desde otros origenes.
- `chart.js`: permite crear graficos dinamicos.

### `.env.example`

Plantilla de configuracion. Se copia a `.env` en cada computadora.

- `PORT`: puerto donde corre el servidor.
- `ORACLE_USER`: usuario Oracle del sistema.
- `ORACLE_PASSWORD`: password del usuario Oracle.
- `ORACLE_CONNECT_STRING`: host, puerto y servicio Oracle.

### `package-lock.json`

Archivo generado automaticamente por npm. Fija las versiones exactas de dependencias para que el proyecto se instale igual en otra computadora.

## Como Explicar El Backend

1. `src/server.js` inicia el servidor.
2. `src/app.js` configura Express, middlewares, archivos estaticos y rutas.
3. `src/config/database.js` crea el pool de conexiones Oracle en modo Thin.
4. `src/middlewares/validate.js` valida campos obligatorios.
5. `src/routes/*.js` contiene los endpoints REST, incluido el alta de categorias.

## Como Explicar El Frontend

1. `public/index.html` contiene la estructura visual de login, modulos, tablas y formularios.
2. `public/css/styles.css` define colores, layout responsive, tablas, botones y estados.
3. `public/js/app.js` consume la API con `fetch()`, renderiza tablas, maneja formularios y dibuja graficos con Chart.js.

## Como Explicar Oracle

1. `sql/01_create_user.sql` prepara el usuario Oracle.
2. `sql/02_schema.sql` ejecuta el esquema completo.
3. `sql/schema.sql` crea tablas, claves, secuencias, triggers y datos de prueba.
4. Las relaciones se implementan con claves foraneas.
5. Los ids se generan automaticamente con secuencias y triggers.

## Puntos Clave Para Defender

- El login consulta realmente la tabla `USUARIOS`.
- El CRUD principal es `EQUIPOS`.
- Las categorias se crean desde la interfaz y alimentan el select de equipos.
- Los prestamos usan transacciones para actualizar `PRESTAMOS` y `EQUIPOS` juntos.
- `FOR UPDATE` bloquea el equipo o prestamo durante operaciones criticas.
- Los reportes y graficos no usan datos simulados: consultan Oracle.
- El proyecto es migrable porque usa `.env.example`, scripts SQL y `package-lock.json`.
