# Documentacion Del Sistema

## Nombre Del Proyecto

Sistema Web de Control de Prestamos de Equipos

## Objetivo

El sistema permite registrar, controlar y consultar prestamos y devoluciones de equipos tecnologicos dentro de una institucion educativa. La aplicacion guarda la informacion en Oracle Database XE y permite demostrar persistencia real de datos.

## Funcionamiento General

1. El usuario ingresa al sistema desde `http://localhost:3000`.
2. Inicia sesion con un usuario registrado en la tabla `USUARIOS`.
3. Luego puede administrar equipos tecnologicos desde el modulo principal.
4. Tambien puede registrar personas que solicitan prestamos.
5. Para registrar un prestamo, selecciona un equipo disponible, una persona y una fecha estimada de devolucion.
6. Al registrar el prestamo, el backend cambia automaticamente el estado del equipo a `PRESTADO`.
7. Al registrar una devolucion, el backend cambia automaticamente el estado del equipo a `DISPONIBLE`.
8. Los reportes y graficos consultan datos reales guardados en Oracle.

## Usuario De Prueba

```text
Usuario: admin
Password: admin123
```

## Base De Datos

El sistema usa Oracle Database XE con el servicio `XEPDB1`.

Usuario configurado:

```text
Usuario Oracle: gestion_equipos
Password Oracle: gestion123
Servicio: localhost:1521/XEPDB1
```

Tablas principales:

- `USUARIOS`
- `CATEGORIAS_EQUIPO`
- `EQUIPOS`
- `PERSONAS`
- `PRESTAMOS`

Relaciones:

- `EQUIPOS.id_categoria` referencia a `CATEGORIAS_EQUIPO.id_categoria`.
- `PRESTAMOS.id_equipo` referencia a `EQUIPOS.id_equipo`.
- `PRESTAMOS.id_persona` referencia a `PERSONAS.id_persona`.

## Modulos Del Sistema

### Login

Valida el usuario y password contra la tabla `USUARIOS`.

Endpoint:

```text
POST /api/login
```

### Equipos

Permite listar, crear, editar, eliminar y filtrar equipos.

Endpoints:

```text
GET /api/equipos
POST /api/equipos
PUT /api/equipos/:id
DELETE /api/equipos/:id
```

### Personas

Permite registrar y listar personas que pueden solicitar prestamos.

Endpoints:

```text
GET /api/personas
POST /api/personas
```

### Categorias

Lista categorias de equipos.

Endpoint:

```text
GET /api/categorias
```

### Prestamos

Permite registrar prestamos y devoluciones.

Endpoints:

```text
GET /api/prestamos
POST /api/prestamos
PUT /api/prestamos/:id/devolver
```

Reglas implementadas:

- Solo se pueden prestar equipos con estado `DISPONIBLE`.
- Al prestar un equipo, su estado cambia a `PRESTADO`.
- Al devolver un equipo, su estado cambia a `DISPONIBLE`.
- La operacion de prestamo y devolucion usa transacciones en Oracle.

### Reportes

Reportes disponibles:

- Equipos con filtros.
- Prestamos activos.
- Prestamos vencidos.
- Historial de prestamos por persona.

Endpoints:

```text
GET /api/reportes/equipos
GET /api/reportes/prestamos-activos
GET /api/reportes/prestamos-vencidos
GET /api/reportes/historial-persona/:id
```

### Graficos

Graficos dinamicos generados con Chart.js:

- Cantidad de equipos por estado.
- Cantidad de prestamos por mes.
- Cantidad de equipos por categoria.

Endpoints:

```text
GET /api/graficos/equipos-estado
GET /api/graficos/prestamos-mes
GET /api/graficos/equipos-categoria
```

## Cumplimiento De Requisitos

| Requisito del enunciado | Cumple | Evidencia |
| --- | --- | --- |
| Frontend con HTML5, CSS3 y JavaScript | Si | `public/index.html`, `public/css/styles.css`, `public/js/app.js` |
| Backend con Node.js y Express | Si | `src/server.js`, `src/app.js`, rutas en `src/routes/` |
| Base de datos Oracle Database XE local usando XEPDB1 | Si | `.env.example`, `sql/create_user.sql`, `sql/schema.sql` |
| Conexion a Oracle con libreria oracledb en modo Thin | Si | `src/config/database.js` usa `oracledb.createPool()` sin cliente Oracle Thick |
| Pool de conexiones Oracle | Si | `poolMin`, `poolMax`, `poolIncrement` en `database.js` |
| Login funcional contra la base de datos | Si | `POST /api/login` consulta tabla `USUARIOS` |
| CRUD completo de una entidad principal | Si | CRUD completo de `EQUIPOS` |
| Minimo 3 tablas relacionadas | Si | `CATEGORIAS_EQUIPO`, `EQUIPOS`, `PERSONAS`, `PRESTAMOS`, `USUARIOS` |
| Servicios web REST | Si | Endpoints REST en `/api/...` |
| Consumo de API desde frontend con `fetch()` | Si | `public/js/app.js` usa `fetch()` en la funcion `api()` |
| Validaciones HTML5 | Si | Formularios usan `required`, `maxlength`, `minlength`, `type` |
| Validaciones basicas en backend | Si | Middleware `requireFields` y validaciones de estado/tipo |
| JavaScript moderno | Si | Uso de `const`, `let`, funciones reutilizables, `async/await` |
| Reporte o tabla dinamica con datos reales desde Oracle | Si | Tablas de equipos, prestamos, activos, vencidos e historial |
| Graficos dinamicos con Chart.js | Si | Graficos en modulo `Graficos` usando datos de Oracle |
| Ejecutar con `npm run dev` | Si | Script definido en `package.json` |

## Cumplimiento Del Alcance

| Alcance solicitado | Cumple | Donde se implementa |
| --- | --- | --- |
| Iniciar sesion | Si | Login inicial y `/api/login` |
| Registrar equipos tecnologicos | Si | Formulario de equipos |
| Editar equipos | Si | Boton `Editar` en tabla de equipos |
| Eliminar equipos | Si | Boton `Eliminar` en tabla de equipos |
| Listar equipos | Si | Tabla principal de equipos |
| Buscar o filtrar equipos | Si | Busqueda y filtro por estado |
| Registrar personas | Si | Modulo `Personas` |
| Registrar prestamos | Si | Modulo `Prestamos` |
| Registrar devoluciones | Si | Boton `Devolver` en prestamos activos |
| Controlar estados de equipos | Si | Estados `DISPONIBLE`, `PRESTADO`, `MANTENIMIENTO` |
| Mostrar equipos prestados/disponibles | Si | Filtro de equipos y reportes |
| Mostrar prestamos vencidos | Si | Reporte de vencidos |
| Mostrar graficos estadisticos | Si | Modulo `Graficos` |

## Scripts De Migracion

Para preparar Oracle en una computadora nueva:

```sql
@sql/01_create_user.sql
```

Luego, conectado como `gestion_equipos`:

```sql
@sql/02_schema.sql
```

Estos scripts permiten recrear el usuario, las tablas, las claves primarias, claves foraneas, secuencias, triggers y datos de prueba.

## Observaciones

- El password del login web se guarda en texto plano porque el objetivo academico es demostrar conexion, CRUD, REST y persistencia en Oracle. En un sistema real se recomienda usar hash de password.
- La autenticacion mantiene la sesion en `sessionStorage` del navegador para una demo simple.
- El sistema esta preparado para migrarse a otra computadora mediante GitHub, `npm install`, `.env.example` y los scripts SQL.
