const express = require('express');
const { execute } = require('../config/database');
const { requireFields } = require('../middlewares/validate');

const router = express.Router();
const estadosValidos = ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO'];

function validarEstado(req, res, next) {
  if (!estadosValidos.includes(req.body.estado)) {
    return res.status(400).json({ message: 'Estado de equipo no valido' });
  }
  next();
}

router.get('/', async (req, res, next) => {
  try {
    const buscar = `%${req.query.buscar || ''}%`;
    const estado = req.query.estado || null;
    const categoria = req.query.categoria || null;

    const result = await execute(
      `SELECT e.id_equipo "id_equipo",
              e.nombre_equipo "nombre_equipo",
              e.marca "marca",
              e.modelo "modelo",
              e.nro_serie "nro_serie",
              e.estado "estado",
              e.id_categoria "id_categoria",
              c.nombre_categoria "nombre_categoria"
       FROM equipos e
       JOIN categorias_equipo c ON c.id_categoria = e.id_categoria
       WHERE (LOWER(e.nombre_equipo) LIKE LOWER(:buscar)
          OR LOWER(e.marca) LIKE LOWER(:buscar)
          OR LOWER(e.modelo) LIKE LOWER(:buscar)
          OR LOWER(e.nro_serie) LIKE LOWER(:buscar))
         AND (:estado IS NULL OR e.estado = :estado)
         AND (:categoria IS NULL OR e.id_categoria = :categoria)
       ORDER BY e.id_equipo DESC`,
      { buscar, estado, categoria }
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await execute(
      `SELECT id_equipo "id_equipo",
              nombre_equipo "nombre_equipo",
              marca "marca",
              modelo "modelo",
              nro_serie "nro_serie",
              estado "estado",
              id_categoria "id_categoria"
       FROM equipos
       WHERE id_equipo = :id`,
      { id: req.params.id }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireFields(['nombre_equipo', 'marca', 'nro_serie', 'estado', 'id_categoria']),
  validarEstado,
  async (req, res, next) => {
    try {
      await execute(
        `INSERT INTO equipos (nombre_equipo, marca, modelo, nro_serie, estado, id_categoria)
         VALUES (:nombre_equipo, :marca, :modelo, :nro_serie, :estado, :id_categoria)`,
        {
          nombre_equipo: req.body.nombre_equipo,
          marca: req.body.marca,
          modelo: req.body.modelo || null,
          nro_serie: req.body.nro_serie,
          estado: req.body.estado,
          id_categoria: req.body.id_categoria
        },
        { autoCommit: true }
      );

      res.status(201).json({ message: 'Equipo registrado correctamente' });
    } catch (error) {
      if (error.errorNum === 1) {
        return res.status(409).json({ message: 'Ya existe un equipo con ese numero de serie' });
      }
      next(error);
    }
  }
);

router.put(
  '/:id',
  requireFields(['nombre_equipo', 'marca', 'nro_serie', 'estado', 'id_categoria']),
  validarEstado,
  async (req, res, next) => {
    try {
      const result = await execute(
        `UPDATE equipos
         SET nombre_equipo = :nombre_equipo,
             marca = :marca,
             modelo = :modelo,
             nro_serie = :nro_serie,
             estado = :estado,
             id_categoria = :id_categoria
         WHERE id_equipo = :id`,
        {
          id: req.params.id,
          nombre_equipo: req.body.nombre_equipo,
          marca: req.body.marca,
          modelo: req.body.modelo || null,
          nro_serie: req.body.nro_serie,
          estado: req.body.estado,
          id_categoria: req.body.id_categoria
        },
        { autoCommit: true }
      );

      if (result.rowsAffected === 0) {
        return res.status(404).json({ message: 'Equipo no encontrado' });
      }

      res.json({ message: 'Equipo actualizado correctamente' });
    } catch (error) {
      if (error.errorNum === 1) {
        return res.status(409).json({ message: 'Ya existe un equipo con ese numero de serie' });
      }
      next(error);
    }
  }
);

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await execute(
      'DELETE FROM equipos WHERE id_equipo = :id',
      { id: req.params.id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    if (error.errorNum === 2292) {
      return res.status(409).json({ message: 'No se puede eliminar: el equipo tiene prestamos asociados' });
    }
    next(error);
  }
});

module.exports = router;
