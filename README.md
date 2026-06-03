# Sistema Web Control Equipos

Proyecto universitario para Programacion 2: aplicacion web para registrar y controlar prestamos de equipos tecnologicos usando HTML, CSS, JavaScript, Node.js, Express y Oracle Database XE.

## Requisitos

- Node.js 18 o superior.
- Oracle Database XE local.
- Pluggable database `XEPDB1` activa.
- Usuario Oracle del proyecto, por defecto `GESTION_EQUIPOS`.

## Instalacion

1. Clonar el proyecto:

```bash
git clone https://github.com/farcapy/pr2-sistema.git
cd pr2-sistema
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo `.env` copiando `.env.example`.

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Contenido esperado:

```env
PORT=3000
ORACLE_USER=GESTION_EQUIPOS
ORACLE_PASSWORD=gestion123
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
```

4. Crear el usuario Oracle conectado como `SYSTEM` o `SYS` en `XEPDB1`:

```bash
sqlplus system/TU_PASSWORD@localhost:1521/XEPDB1
```

```sql
@sql/01_create_user.sql
```

5. Conectarse con el usuario creado:

```bash
sqlplus gestion_equipos/gestion123@localhost:1521/XEPDB1
```

6. Crear tablas, claves, secuencias, triggers y datos de prueba:

```sql
@sql/02_schema.sql
```

7. Ejecutar el proyecto:

```bash
npm run dev
```

En PowerShell, si `npm` esta bloqueado por politicas de ejecucion, usar:

```powershell
npm.cmd run dev
```

8. Abrir en el navegador:

```text
http://localhost:3000
```

## Usuario de prueba

- Usuario: `admin`
- Password: `admin123`

## Solucion ORA-01017

Si al ejecutar `npm run dev` aparece `ORA-01017`, Oracle esta rechazando el usuario de base de datos configurado en `.env`, no el login web.

Ejecutar conectado como `SYSTEM` o `SYS` en `XEPDB1`:

```bash
sqlplus system/TU_PASSWORD@localhost:1521/XEPDB1
```

Luego:

```sql
@sql/fix_user_login.sql
```

Despues conectarse como el usuario del proyecto y ejecutar el esquema:

```bash
sqlplus gestion_equipos/gestion123@localhost:1521/XEPDB1
```

```sql
@sql/schema.sql
```

## Migracion A Otra Computadora

Para presentar en la universidad:

1. Subir el proyecto a GitHub.
2. No subir `.env` ni `node_modules`; ya estan excluidos en `.gitignore`.
3. Clonar el repositorio en la maquina de la universidad.
4. Ejecutar `npm install`.
5. Copiar `.env.example` a `.env`.
6. Verificar que Oracle XE este activo y que la conexion use `localhost:1521/XEPDB1`.
7. Ejecutar `sql/01_create_user.sql` como `SYSTEM` o `SYS`.
8. Ejecutar `sql/02_schema.sql` como `gestion_equipos`.
9. Ejecutar `npm run dev`.

Repositorio:

```text
https://github.com/farcapy/pr2-sistema
```

Los datos fijos del proyecto son:

```text
Usuario Oracle: gestion_equipos
Password Oracle: gestion123
Servicio Oracle: localhost:1521/XEPDB1
Usuario web: admin
Password web: admin123
```

## Funcionalidades

- Login contra tabla `USUARIOS`.
- CRUD completo de `EQUIPOS`.
- Registro y listado de personas.
- Registro de prestamos.
- Registro de devoluciones.
- Cambio automatico de equipo a `PRESTADO` al prestar.
- Cambio automatico de equipo a `DISPONIBLE` al devolver.
- Reportes de prestamos activos, vencidos e historial por persona.
- Graficos dinamicos con Chart.js.

## Funcionamiento Del Sistema

1. El usuario abre `http://localhost:3000`.
2. Inicia sesion con un usuario existente en la tabla `USUARIOS`.
3. El sistema carga categorias, equipos, personas, prestamos, reportes y graficos desde Oracle.
4. En el modulo `Equipos` se puede crear, editar, eliminar, listar y filtrar equipos.
5. En el modulo `Personas` se registran solicitantes de prestamos.
6. En el modulo `Prestamos` se registra el prestamo de un equipo disponible.
7. Al prestar un equipo, el backend cambia su estado a `PRESTADO`.
8. Al devolver un equipo, el backend cambia su estado a `DISPONIBLE`.
9. Los reportes y graficos muestran informacion real obtenida desde Oracle.

## Cumplimiento Del Enunciado

| Requisito | Cumple | Evidencia |
| --- | --- | --- |
| Frontend con HTML5, CSS3 y JavaScript | Si | `public/index.html`, `public/css/styles.css`, `public/js/app.js` |
| Backend con Node.js y Express | Si | `src/server.js`, `src/app.js`, `src/routes/` |
| Oracle Database XE local usando XEPDB1 | Si | `.env.example`, `sql/create_user.sql`, `sql/schema.sql` |
| Conexion Oracle con `oracledb` Thin y pool | Si | `src/config/database.js` |
| Login funcional contra base de datos | Si | `POST /api/login` consulta `USUARIOS` |
| CRUD completo de entidad principal | Si | CRUD completo de `EQUIPOS` |
| Minimo 3 tablas relacionadas | Si | `CATEGORIAS_EQUIPO`, `EQUIPOS`, `PERSONAS`, `PRESTAMOS` |
| Servicios web REST | Si | Rutas `/api/...` |
| Consumo de API con `fetch()` | Si | Funcion `api()` en `public/js/app.js` |
| Validaciones HTML5 y backend | Si | Formularios HTML y middleware `requireFields` |
| JavaScript moderno | Si | `const`, `let`, funciones reutilizables, `async/await` |
| Reportes con datos reales desde Oracle | Si | Modulo `Reportes` |
| Graficos dinamicos con Chart.js | Si | Modulo `Graficos` |
| Ejecutar con `npm run dev` | Si | Script en `package.json` |

La documentacion completa del funcionamiento y cumplimiento esta en:

```text
DOCUMENTACION_SISTEMA.md
```

La guia para explicar el codigo durante la defensa esta en:

```text
GUIA_EXPLICACION_CODIGO.md
```

## Estructura

```text
Gestion_Equipos/
  public/
    css/styles.css
    img/logo-columbia-recortado.png
    js/app.js
    index.html
  sql/
    01_create_user.sql
    02_schema.sql
    create_user.sql
    fix_user_login.sql
    README_SQL.md
    schema.sql
  DOCUMENTACION_SISTEMA.md
  GUIA_EXPLICACION_CODIGO.md
  MIGRACION.md
  src/
    config/database.js
    middlewares/validate.js
    routes/
      auth.js
      categorias.js
      equipos.js
      graficos.js
      personas.js
      prestamos.js
      reportes.js
    app.js
    server.js
  .env.example
  package.json
```

## Endpoints principales

- `POST /api/login`
- `GET /api/equipos`
- `POST /api/equipos`
- `PUT /api/equipos/:id`
- `DELETE /api/equipos/:id`
- `GET /api/personas`
- `POST /api/personas`
- `GET /api/prestamos`
- `POST /api/prestamos`
- `PUT /api/prestamos/:id/devolver`
- `GET /api/reportes/prestamos-activos`
- `GET /api/reportes/prestamos-vencidos`
- `GET /api/reportes/historial-persona/:id`
- `GET /api/graficos/equipos-estado`
- `GET /api/graficos/prestamos-mes`
- `GET /api/graficos/equipos-categoria`
