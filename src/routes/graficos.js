const express = require('express');
const { execute } = require('../config/database');

const router = express.Router();

router.get('/equipos-estado', async (req, res, next) => {
  try {
    const result = await execute(
      `SELECT estado "label", COUNT(*) "cantidad"
       FROM equipos
       GROUP BY estado
       ORDER BY estado`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/prestamos-mes', async (req, res, next) => {
  try {
    const result = await execute(
      `SELECT TO_CHAR(fecha_prestamo, 'YYYY-MM') "label", COUNT(*) "cantidad"
       FROM prestamos
       GROUP BY TO_CHAR(fecha_prestamo, 'YYYY-MM')
       ORDER BY TO_CHAR(fecha_prestamo, 'YYYY-MM')`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/equipos-categoria', async (req, res, next) => {
  try {
    const result = await execute(
      `SELECT c.nombre_categoria "label", COUNT(e.id_equipo) "cantidad"
       FROM categorias_equipo c
       LEFT JOIN equipos e ON e.id_categoria = c.id_categoria
       GROUP BY c.nombre_categoria
       ORDER BY c.nombre_categoria`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
