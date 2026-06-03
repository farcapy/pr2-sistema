const express = require('express');
const { execute } = require('../config/database');

const router = express.Router();

router.get('/equipos', async (req, res, next) => {
  try {
    const estado = req.query.estado || null;
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
      { estado }
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/prestamos-activos', async (req, res, next) => {
  try {
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
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/prestamos-vencidos', async (req, res, next) => {
  try {
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
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/historial-persona/:id', async (req, res, next) => {
  try {
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
      { id: req.params.id }
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
