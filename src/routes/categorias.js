// Importa Express para crear rutas.
const express = require('express');
// Importa helper de ejecucion SQL.
const { execute } = require('../config/database');
// Importa middleware para validar campos obligatorios.
const { requireFields } = require('../middlewares/validate');

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

// Ruta POST /api/categorias.
// Permite registrar una nueva categoria desde el frontend.
router.post('/', requireFields(['nombre_categoria']), async (req, res, next) => {
  try {
    // Inserta la categoria en Oracle.
    await execute(
      `INSERT INTO categorias_equipo (nombre_categoria, descripcion)
       VALUES (:nombre_categoria, :descripcion)`,
      {
        // Nombre de la categoria enviado por el formulario.
        nombre_categoria: req.body.nombre_categoria,
        // Descripcion opcional; si viene vacia se guarda NULL.
        descripcion: req.body.descripcion || null
      },
      // Confirma automaticamente el INSERT.
      { autoCommit: true }
    );

    // Devuelve HTTP 201 porque se creo una categoria.
    res.status(201).json({ message: 'Categoria registrada correctamente' });
  } catch (error) {
    // ORA-00001 significa que el nombre_categoria ya existe.
    if (error.errorNum === 1) {
      return res.status(409).json({ message: 'Ya existe una categoria con ese nombre' });
    }
    // Otros errores pasan al manejador global.
    next(error);
  }
});

// Exporta el router para usarlo desde app.js.
module.exports = router;
