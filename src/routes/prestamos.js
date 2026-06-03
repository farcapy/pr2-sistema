const express = require('express');
const { oracledb } = require('../config/database');
const { requireFields } = require('../middlewares/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
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
    res.json(result.rows);
  } catch (error) {
    next(error);
  } finally {
    if (connection) await connection.close();
  }
});

router.post('/', requireFields(['id_equipo', 'id_persona', 'fecha_devolucion_estimada']), async (req, res, next) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    const equipo = await connection.execute(
      'SELECT estado "estado" FROM equipos WHERE id_equipo = :id_equipo FOR UPDATE',
      { id_equipo: req.body.id_equipo }
    );

    if (equipo.rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    if (equipo.rows[0].estado !== 'DISPONIBLE') {
      await connection.rollback();
      return res.status(409).json({ message: 'Solo se pueden prestar equipos disponibles' });
    }

    await connection.execute(
      `INSERT INTO prestamos
       (id_equipo, id_persona, fecha_prestamo, fecha_devolucion_estimada, estado_prestamo, observacion)
       VALUES (:id_equipo, :id_persona, SYSDATE, TO_DATE(:fecha_devolucion_estimada, 'YYYY-MM-DD'), 'ACTIVO', :observacion)`,
      {
        id_equipo: req.body.id_equipo,
        id_persona: req.body.id_persona,
        fecha_devolucion_estimada: req.body.fecha_devolucion_estimada,
        observacion: req.body.observacion || null
      }
    );

    await connection.execute(
      `UPDATE equipos SET estado = 'PRESTADO' WHERE id_equipo = :id_equipo`,
      { id_equipo: req.body.id_equipo }
    );

    await connection.commit();
    res.status(201).json({ message: 'Prestamo registrado correctamente' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) await connection.close();
  }
});

router.put('/:id/devolver', async (req, res, next) => {
  let connection;
  try {
    connection = await oracledb.getConnection();

    const prestamo = await connection.execute(
      `SELECT id_equipo "id_equipo", estado_prestamo "estado_prestamo"
       FROM prestamos
       WHERE id_prestamo = :id
       FOR UPDATE`,
      { id: req.params.id }
    );

    if (prestamo.rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Prestamo no encontrado' });
    }

    if (prestamo.rows[0].estado_prestamo === 'DEVUELTO') {
      await connection.rollback();
      return res.status(409).json({ message: 'El prestamo ya fue devuelto' });
    }

    await connection.execute(
      `UPDATE prestamos
       SET estado_prestamo = 'DEVUELTO',
           fecha_devolucion_real = SYSDATE,
           observacion = NVL(:observacion, observacion)
       WHERE id_prestamo = :id`,
      { id: req.params.id, observacion: req.body.observacion || null }
    );

    await connection.execute(
      `UPDATE equipos SET estado = 'DISPONIBLE' WHERE id_equipo = :id_equipo`,
      { id_equipo: prestamo.rows[0].id_equipo }
    );

    await connection.commit();
    res.json({ message: 'Devolucion registrada correctamente' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;
