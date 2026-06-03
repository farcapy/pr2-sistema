// Importa Express para crear rutas REST.
const express = require('express');
// Importa helper para ejecutar SQL contra Oracle.
const { execute } = require('../config/database');
// Importa middleware para validar campos obligatorios.
const { requireFields } = require('../middlewares/validate');

// Router del modulo Personas.
const router = express.Router();
// Tipos permitidos para mantener coherencia con el CHECK de la tabla PERSONAS.
const tiposValidos = ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO'];

// Ruta GET /api/personas.
// Lista personas y permite busqueda por nombre, apellido o documento.
router.get('/', async (req, res, next) => {
  try {
    // Crea patron para busqueda parcial; si no se envia buscar, trae todo.
    const buscar = `%${req.query.buscar || ''}%`;
    // Consulta personas ordenadas por apellido y nombre.
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
      // Bind usado en el LIKE.
      { buscar }
    );
    // Devuelve el arreglo de personas al frontend.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al middleware global.
    next(error);
  }
});

// Ruta POST /api/personas.
// Registra una nueva persona solicitante.
router.post('/', requireFields(['nombre', 'apellido', 'documento', 'tipo_persona']), async (req, res, next) => {
  // Valida que el tipo de persona pertenezca a la lista permitida.
  if (!tiposValidos.includes(req.body.tipo_persona)) {
    // Rechaza el dato invalido con HTTP 400.
    return res.status(400).json({ message: 'Tipo de persona no valido' });
  }

  try {
    // Inserta la persona en Oracle.
    await execute(
      `INSERT INTO personas (nombre, apellido, documento, tipo_persona, telefono)
       VALUES (:nombre, :apellido, :documento, :tipo_persona, :telefono)`,
      {
        // Nombre enviado desde el formulario.
        nombre: req.body.nombre,
        // Apellido enviado desde el formulario.
        apellido: req.body.apellido,
        // Documento unico de la persona.
        documento: req.body.documento,
        // Tipo validado previamente.
        tipo_persona: req.body.tipo_persona,
        // Telefono opcional; si viene vacio se guarda NULL.
        telefono: req.body.telefono || null
      },
      // Confirma automaticamente el INSERT.
      { autoCommit: true }
    );
    // Devuelve HTTP 201 porque se creo un registro.
    res.status(201).json({ message: 'Persona registrada correctamente' });
  } catch (error) {
    // ORA-00001 por documento duplicado.
    if (error.errorNum === 1) {
      // HTTP 409 indica conflicto con un registro existente.
      return res.status(409).json({ message: 'Ya existe una persona con ese documento' });
    }
    // Otros errores pasan al manejador global.
    next(error);
  }
});

// Exporta el router de personas.
module.exports = router;
