const express = require('express');
const { execute } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await execute(
      `SELECT id_categoria "id_categoria",
              nombre_categoria "nombre_categoria",
              descripcion "descripcion"
       FROM categorias_equipo
       ORDER BY nombre_categoria`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
