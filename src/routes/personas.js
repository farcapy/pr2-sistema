const express = require('express');
const { execute } = require('../config/database');
const { requireFields } = require('../middlewares/validate');

const router = express.Router();
const tiposValidos = ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO'];

router.get('/', async (req, res, next) => {
  try {
    const buscar = `%${req.query.buscar || ''}%`;
    const result = await execute(
      `SELECT id_persona "id_persona",
              nombre "nombre",
              apellido "apellido",
              documento "documento",
              tipo_persona "tipo_persona",
              telefono "telefono"
       FROM personas
       WHERE LOWER(nombre || ' ' || apellido || ' ' || documento) LIKE LOWER(:buscar)
       ORDER BY apellido, nombre`,
      { buscar }
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireFields(['nombre', 'apellido', 'documento', 'tipo_persona']), async (req, res, next) => {
  if (!tiposValidos.includes(req.body.tipo_persona)) {
    return res.status(400).json({ message: 'Tipo de persona no valido' });
  }

  try {
    await execute(
      `INSERT INTO personas (nombre, apellido, documento, tipo_persona, telefono)
       VALUES (:nombre, :apellido, :documento, :tipo_persona, :telefono)`,
      {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        documento: req.body.documento,
        tipo_persona: req.body.tipo_persona,
        telefono: req.body.telefono || null
      },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Persona registrada correctamente' });
  } catch (error) {
    if (error.errorNum === 1) {
      return res.status(409).json({ message: 'Ya existe una persona con ese documento' });
    }
    next(error);
  }
});

module.exports = router;
