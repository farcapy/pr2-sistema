// Importa Express para crear rutas de reportes.
const express = require('express');
// Importa helper para ejecutar consultas SQL.
const { execute } = require('../config/database');

// Router del modulo Reportes.
const router = express.Router();

// Ruta GET /api/reportes/equipos.
// Genera reporte de equipos con filtro opcional por estado.
router.get('/equipos', async (req, res, next) => {
  try {
    // Lee filtro opcional por estado desde query string.
    const estado = req.query.estado || null;
    // Consulta equipos con nombre de categoria.
    const result = await execute(
      `SELECT e.id_equipo "id_equipo",
              e.nombre_equipo "nombre_equipo",
              e.marca "marca",
              e.modelo "modelo",
              e.nro_serie "nro_serie",
              e.estado "estado",
              c.nombre_categoria "nombre_categoria"
       FROM equipos e
       JOIN categorias_equipo c ON c.id_categoria = e.id_categoria
       WHERE (:estado IS NULL OR e.estado = :estado)
       ORDER BY c.nombre_categoria, e.nombre_equipo`,
      // Bind del filtro estado.
      { estado }
    );
    // Devuelve filas del reporte.
    res.json(result.rows);
  } catch (error) {
    // Envia error al manejador global.
    next(error);
  }
});

// Ruta GET /api/reportes/prestamos-activos.
// Lista prestamos que aun no fueron devueltos.
router.get('/prestamos-activos', async (req, res, next) => {
  try {
    // Consulta prestamos activos con equipo y persona.
    const result = await execute(
      `SELECT p.id_prestamo "id_prestamo",
              e.nombre_equipo "nombre_equipo",
              pe.nombre || ' ' || pe.apellido "persona",
              TO_CHAR(p.fecha_prestamo, 'YYYY-MM-DD') "fecha_prestamo",
              TO_CHAR(p.fecha_devolucion_estimada, 'YYYY-MM-DD') "fecha_devolucion_estimada"
       FROM prestamos p
       JOIN equipos e ON e.id_equipo = p.id_equipo
       JOIN personas pe ON pe.id_persona = p.id_persona
       WHERE p.estado_prestamo = 'ACTIVO'
       ORDER BY p.fecha_devolucion_estimada`
    );
    // Devuelve prestamos activos.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al manejador global.
    next(error);
  }
});

// Ruta GET /api/reportes/prestamos-vencidos.
// Lista prestamos activos cuya fecha estimada ya paso.
router.get('/prestamos-vencidos', async (req, res, next) => {
  try {
    // Consulta prestamos vencidos comparando contra SYSDATE.
    const result = await execute(
      `SELECT p.id_prestamo "id_prestamo",
              e.nombre_equipo "nombre_equipo",
              pe.nombre || ' ' || pe.apellido "persona",
              TO_CHAR(p.fecha_devolucion_estimada, 'YYYY-MM-DD') "fecha_devolucion_estimada",
              TRUNC(SYSDATE) - TRUNC(p.fecha_devolucion_estimada) "dias_vencidos"
       FROM prestamos p
       JOIN equipos e ON e.id_equipo = p.id_equipo
       JOIN personas pe ON pe.id_persona = p.id_persona
       WHERE p.estado_prestamo = 'ACTIVO'
         AND p.fecha_devolucion_estimada < TRUNC(SYSDATE)
       ORDER BY p.fecha_devolucion_estimada`
    );
    // Devuelve prestamos vencidos.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al manejador global.
    next(error);
  }
});

// Ruta GET /api/reportes/historial-persona/:id.
// Muestra todos los prestamos de una persona.
router.get('/historial-persona/:id', async (req, res, next) => {
  try {
    // Consulta historial por persona.
    const result = await execute(
      `SELECT p.id_prestamo "id_prestamo",
              e.nombre_equipo "nombre_equipo",
              TO_CHAR(p.fecha_prestamo, 'YYYY-MM-DD') "fecha_prestamo",
              TO_CHAR(p.fecha_devolucion_estimada, 'YYYY-MM-DD') "fecha_devolucion_estimada",
              TO_CHAR(p.fecha_devolucion_real, 'YYYY-MM-DD') "fecha_devolucion_real",
              p.estado_prestamo "estado_prestamo"
       FROM prestamos p
       JOIN equipos e ON e.id_equipo = p.id_equipo
       WHERE p.id_persona = :id
       ORDER BY p.fecha_prestamo DESC`,
      // Id de persona recibido por URL.
      { id: req.params.id }
    );
    // Devuelve historial.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al manejador global.
    next(error);
  }
});

// Exporta router de reportes.
module.exports = router;
