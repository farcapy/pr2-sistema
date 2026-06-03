// Importa Express para crear rutas.
const express = require('express');
// Importa helper de ejecucion SQL.
const { execute } = require('../config/database');

// Router especifico para categorias.
const router = express.Router();

// Ruta GET /api/categorias.
// Devuelve todas las categorias para llenar selects del frontend.
router.get('/', async (req, res, next) => {
  try {
    // Consulta las categorias ordenadas alfabeticamente.
    const result = await execute(
      `SELECT id_categoria "id_categoria",
              nombre_categoria "nombre_categoria",
              descripcion "descripcion"
       FROM categorias_equipo
       ORDER BY nombre_categoria`
    );
    // Responde al frontend con arreglo JSON de categorias.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al manejador global.
    next(error);
  }
});

// Exporta el router para usarlo desde app.js.
module.exports = router;
