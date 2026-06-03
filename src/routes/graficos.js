// Importa Express para definir rutas.
const express = require('express');
// Importa helper para ejecutar SQL.
const { execute } = require('../config/database');

// Router del modulo Graficos.
const router = express.Router();

// Ruta GET /api/graficos/equipos-estado.
// Devuelve cantidad de equipos agrupados por estado.
router.get('/equipos-estado', async (req, res, next) => {
  try {
    // COUNT(*) cuenta equipos por cada estado.
    const result = await execute(
      `SELECT estado "label", COUNT(*) "cantidad"
       FROM equipos
       GROUP BY estado
       ORDER BY estado`
    );
    // Devuelve formato compatible con Chart.js: label + cantidad.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al manejador global.
    next(error);
  }
});

// Ruta GET /api/graficos/prestamos-mes.
// Devuelve cantidad de prestamos agrupados por mes.
router.get('/prestamos-mes', async (req, res, next) => {
  try {
    // TO_CHAR(fecha_prestamo, 'YYYY-MM') agrupa por ano y mes.
    const result = await execute(
      `SELECT TO_CHAR(fecha_prestamo, 'YYYY-MM') "label", COUNT(*) "cantidad"
       FROM prestamos
       GROUP BY TO_CHAR(fecha_prestamo, 'YYYY-MM')
       ORDER BY TO_CHAR(fecha_prestamo, 'YYYY-MM')`
    );
    // Devuelve datos para grafico de barras.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al manejador global.
    next(error);
  }
});

// Ruta GET /api/graficos/equipos-categoria.
// Devuelve cantidad de equipos agrupados por categoria.
router.get('/equipos-categoria', async (req, res, next) => {
  try {
    // LEFT JOIN incluye categorias aunque todavia no tengan equipos.
    const result = await execute(
      `SELECT c.nombre_categoria "label", COUNT(e.id_equipo) "cantidad"
       FROM categorias_equipo c
       LEFT JOIN equipos e ON e.id_categoria = c.id_categoria
       GROUP BY c.nombre_categoria
       ORDER BY c.nombre_categoria`
    );
    // Devuelve datos listos para Chart.js.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al manejador global.
    next(error);
  }
});

// Exporta router de graficos.
module.exports = router;
