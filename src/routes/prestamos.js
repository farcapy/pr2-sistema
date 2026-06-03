// Importa Express para declarar rutas.
const express = require('express');
// Importa oracledb directamente porque aqui se usan transacciones manuales.
const { oracledb } = require('../config/database');
// Importa middleware de campos obligatorios.
const { requireFields } = require('../middlewares/validate');

// Router del modulo Prestamos.
const router = express.Router();

// Ruta GET /api/prestamos.
// Lista prestamos con datos del equipo y de la persona.
router.get('/', async (req, res, next) => {
  // Se declara la conexion para cerrarla siempre en finally.
  let connection;
  try {
    // Toma una conexion del pool.
    connection = await oracledb.getConnection();
    // Consulta prestamos relacionados con equipos y personas.
    const result = await connection.execute(
      `SELECT p.id_prestamo "id_prestamo",
              p.id_equipo "id_equipo",
              e.nombre_equipo "nombre_equipo",
              p.id_persona "id_persona",
              pe.nombre || ' ' || pe.apellido "persona",
              TO_CHAR(p.fecha_prestamo, 'YYYY-MM-DD') "fecha_prestamo",
              TO_CHAR(p.fecha_devolucion_estimada, 'YYYY-MM-DD') "fecha_devolucion_estimada",
              TO_CHAR(p.fecha_devolucion_real, 'YYYY-MM-DD') "fecha_devolucion_real",
              p.estado_prestamo "estado_prestamo",
              p.observacion "observacion"
       FROM prestamos p
       JOIN equipos e ON e.id_equipo = p.id_equipo
       JOIN personas pe ON pe.id_persona = p.id_persona
       ORDER BY p.id_prestamo DESC`
    );
    // Devuelve listado completo al frontend.
    res.json(result.rows);
  } catch (error) {
    // Pasa errores al manejador global.
    next(error);
  } finally {
    // Libera la conexion aunque ocurra un error.
    if (connection) await connection.close();
  }
});

// Ruta POST /api/prestamos.
// Registra un prestamo y cambia el equipo a PRESTADO en una misma transaccion.
router.post('/', requireFields(['id_equipo', 'id_persona', 'fecha_devolucion_estimada']), async (req, res, next) => {
  // Conexion manual para poder hacer commit o rollback.
  let connection;
  try {
    // Obtiene conexion del pool.
    connection = await oracledb.getConnection();

    // Bloquea la fila del equipo mientras se registra el prestamo.
    // FOR UPDATE evita que dos usuarios presten el mismo equipo al mismo tiempo.
    const equipo = await connection.execute(
      'SELECT estado "estado" FROM equipos WHERE id_equipo = :id_equipo FOR UPDATE',
      // Id del equipo enviado desde el formulario.
      { id_equipo: req.body.id_equipo }
    );

    // Si no existe el equipo, se cancela la transaccion.
    if (equipo.rows.length === 0) {
      // Deshace cualquier cambio pendiente.
      await connection.rollback();
      // Responde recurso no encontrado.
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    // Solo se permite prestar equipos disponibles.
    if (equipo.rows[0].estado !== 'DISPONIBLE') {
      // Cancela la transaccion porque no cumple la regla de negocio.
      await connection.rollback();
      // HTTP 409 indica conflicto con el estado actual del equipo.
      return res.status(409).json({ message: 'Solo se pueden prestar equipos disponibles' });
    }

    // Inserta el prestamo como ACTIVO.
    await connection.execute(
      `INSERT INTO prestamos
       (id_equipo, id_persona, fecha_prestamo, fecha_devolucion_estimada, estado_prestamo, observacion)
       VALUES (:id_equipo, :id_persona, SYSDATE, TO_DATE(:fecha_devolucion_estimada, 'YYYY-MM-DD'), 'ACTIVO', :observacion)`,
      {
        // Equipo prestado.
        id_equipo: req.body.id_equipo,
        // Persona que recibe el equipo.
        id_persona: req.body.id_persona,
        // Fecha estimada enviada en formato YYYY-MM-DD desde input type=date.
        fecha_devolucion_estimada: req.body.fecha_devolucion_estimada,
        // Observacion opcional.
        observacion: req.body.observacion || null
      }
    );

    // Actualiza el estado del equipo porque ya esta prestado.
    await connection.execute(
      `UPDATE equipos SET estado = 'PRESTADO' WHERE id_equipo = :id_equipo`,
      // Usa el mismo id_equipo del prestamo.
      { id_equipo: req.body.id_equipo }
    );

    // Confirma INSERT de prestamo y UPDATE de equipo juntos.
    await connection.commit();
    // Devuelve HTTP 201 por prestamo creado.
    res.status(201).json({ message: 'Prestamo registrado correctamente' });
  } catch (error) {
    // Si algo falla, deshace todos los cambios de la transaccion.
    if (connection) await connection.rollback();
    // Envia error al manejador global.
    next(error);
  } finally {
    // Libera la conexion.
    if (connection) await connection.close();
  }
});

// Ruta PUT /api/prestamos/:id/devolver.
// Marca un prestamo como devuelto y libera el equipo.
router.put('/:id/devolver', async (req, res, next) => {
  // Conexion manual para controlar commit/rollback.
  let connection;
  try {
    // Toma conexion del pool.
    connection = await oracledb.getConnection();

    // Busca y bloquea el prestamo para evitar doble devolucion simultanea.
    const prestamo = await connection.execute(
      `SELECT id_equipo "id_equipo", estado_prestamo "estado_prestamo"
       FROM prestamos
       WHERE id_prestamo = :id
       FOR UPDATE`,
      // Id del prestamo tomado de la URL.
      { id: req.params.id }
    );

    // Si el prestamo no existe, se cancela.
    if (prestamo.rows.length === 0) {
      // Rollback por seguridad.
      await connection.rollback();
      // Recurso no encontrado.
      return res.status(404).json({ message: 'Prestamo no encontrado' });
    }

    // Si ya fue devuelto, no se permite repetir la devolucion.
    if (prestamo.rows[0].estado_prestamo === 'DEVUELTO') {
      // Cancela transaccion.
      await connection.rollback();
      // Devuelve conflicto por estado actual.
      return res.status(409).json({ message: 'El prestamo ya fue devuelto' });
    }

    // Actualiza el prestamo con fecha real de devolucion.
    await connection.execute(
      `UPDATE prestamos
       SET estado_prestamo = 'DEVUELTO',
           fecha_devolucion_real = SYSDATE,
           observacion = NVL(:observacion, observacion)
       WHERE id_prestamo = :id`,
      // Observacion es opcional; NVL mantiene la anterior si no se envia.
      { id: req.params.id, observacion: req.body.observacion || null }
    );

    // Cambia el equipo asociado a DISPONIBLE.
    await connection.execute(
      `UPDATE equipos SET estado = 'DISPONIBLE' WHERE id_equipo = :id_equipo`,
      // Usa el id_equipo obtenido desde el prestamo bloqueado.
      { id_equipo: prestamo.rows[0].id_equipo }
    );

    // Confirma devolucion y cambio de estado juntos.
    await connection.commit();
    // Informa exito.
    res.json({ message: 'Devolucion registrada correctamente' });
  } catch (error) {
    // Si falla algo, deshace la transaccion completa.
    if (connection) await connection.rollback();
    // Pasa el error al manejador global.
    next(error);
  } finally {
    // Libera la conexion al pool.
    if (connection) await connection.close();
  }
});

// Exporta router de prestamos.
module.exports = router;
