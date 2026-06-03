// Importa Express para definir rutas REST.
const express = require('express');
// Importa helper para ejecutar SQL en Oracle.
const { execute } = require('../config/database');
// Importa middleware de campos obligatorios.
const { requireFields } = require('../middlewares/validate');

// Crea router para el CRUD de equipos.
const router = express.Router();
// Lista de estados permitidos para mantener consistencia con el CHECK de Oracle.
const estadosValidos = ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO'];

// Middleware que valida que el estado enviado sea uno de los permitidos.
function validarEstado(req, res, next) {
  // Si el estado no esta en la lista, se rechaza la peticion.
  if (!estadosValidos.includes(req.body.estado)) {
    // HTTP 400 indica que el cliente envio un dato invalido.
    return res.status(400).json({ message: 'Estado de equipo no valido' });
  }
  // Si es valido, continua con la ruta.
  next();
}

// Ruta GET /api/equipos.
// Lista equipos y permite buscar/filtrar con query params.
router.get('/', async (req, res, next) => {
  try {
    // Arma patron LIKE para buscar texto parcial.
    const buscar = `%${req.query.buscar || ''}%`;
    // Filtro opcional por estado; null significa sin filtro.
    const estado = req.query.estado || null;
    // Filtro opcional por categoria; null significa sin filtro.
    const categoria = req.query.categoria || null;

    // Consulta equipos junto con su categoria.
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
      // Parametros bind usados por la consulta SQL.
      { buscar, estado, categoria }
    );

    // Devuelve el listado al frontend.
    res.json(result.rows);
  } catch (error) {
    // Envia errores al manejador global.
    next(error);
  }
});

// Ruta GET /api/equipos/:id.
// Busca un equipo puntual por su clave primaria.
router.get('/:id', async (req, res, next) => {
  try {
    // Consulta un equipo por id.
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
      // :id toma el valor de la URL.
      { id: req.params.id }
    );

    // Si no hay filas, el id no existe.
    if (result.rows.length === 0) {
      // HTTP 404 indica recurso no encontrado.
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    // Devuelve solo el primer registro porque el id es unico.
    res.json(result.rows[0]);
  } catch (error) {
    // Pasa errores al manejador global.
    next(error);
  }
});

// Ruta POST /api/equipos.
// Crea un equipo nuevo.
router.post(
  '/',
  // Valida que los campos principales hayan sido enviados.
  requireFields(['nombre_equipo', 'marca', 'nro_serie', 'estado', 'id_categoria']),
  // Valida que el estado sea permitido.
  validarEstado,
  async (req, res, next) => {
    try {
      // Inserta el equipo en Oracle.
      await execute(
        `INSERT INTO equipos (nombre_equipo, marca, modelo, nro_serie, estado, id_categoria)
         VALUES (:nombre_equipo, :marca, :modelo, :nro_serie, :estado, :id_categoria)`,
        {
          // Nombre del equipo enviado desde el formulario.
          nombre_equipo: req.body.nombre_equipo,
          // Marca del equipo.
          marca: req.body.marca,
          // Modelo es opcional; si viene vacio se guarda NULL.
          modelo: req.body.modelo || null,
          // Numero de serie unico.
          nro_serie: req.body.nro_serie,
          // Estado validado previamente.
          estado: req.body.estado,
          // Categoria relacionada por clave foranea.
          id_categoria: req.body.id_categoria
        },
        // Confirma la transaccion automaticamente para persistir el INSERT.
        { autoCommit: true }
      );

      // HTTP 201 indica recurso creado.
      res.status(201).json({ message: 'Equipo registrado correctamente' });
    } catch (error) {
      // ORA-00001: violacion de restriccion unica, por ejemplo nro_serie repetido.
      if (error.errorNum === 1) {
        // HTTP 409 indica conflicto con datos existentes.
        return res.status(409).json({ message: 'Ya existe un equipo con ese numero de serie' });
      }
      // Otros errores se manejan globalmente.
      next(error);
    }
  }
);

// Ruta PUT /api/equipos/:id.
// Actualiza todos los datos editables de un equipo.
router.put(
  '/:id',
  // Requiere los campos principales para actualizar.
  requireFields(['nombre_equipo', 'marca', 'nro_serie', 'estado', 'id_categoria']),
  // Valida el estado antes de actualizar.
  validarEstado,
  async (req, res, next) => {
    try {
      // Ejecuta UPDATE y guarda rowsAffected para saber si actualizo algo.
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
          // Id del equipo tomado de la URL.
          id: req.params.id,
          // Nuevos datos enviados por el frontend.
          nombre_equipo: req.body.nombre_equipo,
          marca: req.body.marca,
          modelo: req.body.modelo || null,
          nro_serie: req.body.nro_serie,
          estado: req.body.estado,
          id_categoria: req.body.id_categoria
        },
        // Confirma automaticamente la actualizacion.
        { autoCommit: true }
      );

      // Si rowsAffected es 0, ningun equipo tenia ese id.
      if (result.rowsAffected === 0) {
        // Devuelve 404 porque no existe el equipo.
        return res.status(404).json({ message: 'Equipo no encontrado' });
      }

      // Respuesta exitosa.
      res.json({ message: 'Equipo actualizado correctamente' });
    } catch (error) {
      // Controla nro_serie duplicado.
      if (error.errorNum === 1) {
        return res.status(409).json({ message: 'Ya existe un equipo con ese numero de serie' });
      }
      // Otros errores al manejador global.
      next(error);
    }
  }
);

// Ruta DELETE /api/equipos/:id.
// Elimina un equipo si no tiene prestamos asociados.
router.delete('/:id', async (req, res, next) => {
  try {
    // Ejecuta DELETE por id.
    const result = await execute(
      'DELETE FROM equipos WHERE id_equipo = :id',
      // Id tomado de la URL.
      { id: req.params.id },
      // Confirma automaticamente el borrado.
      { autoCommit: true }
    );

    // Si no borro filas, el id no existe.
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    // Informa eliminacion correcta.
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    // ORA-02292: no se puede borrar porque otra tabla lo referencia.
    if (error.errorNum === 2292) {
      // Devuelve conflicto porque existen prestamos asociados.
      return res.status(409).json({ message: 'No se puede eliminar: el equipo tiene prestamos asociados' });
    }
    // Otros errores al manejador global.
    next(error);
  }
});

// Exporta el router de equipos.
module.exports = router;
