// Importa Express para crear un router independiente.
const express = require('express');
// Importa el helper execute para consultar Oracle.
const { execute } = require('../config/database');
// Importa middleware para validar campos obligatorios.
const { requireFields } = require('../middlewares/validate');

// Crea un router para las rutas de autenticacion.
const router = express.Router();

// Ruta POST /api/login.
// Recibe usuario y password desde el frontend.
router.post('/', requireFields(['usuario', 'password']), async (req, res, next) => {
  try {
    // Consulta Oracle buscando un usuario que coincida con las credenciales enviadas.
    const result = await execute(
      // Los alias entre comillas fuerzan nombres de propiedades en minuscula para JavaScript.
      `SELECT id_usuario "id_usuario", usuario "usuario", nombre "nombre", rol "rol"
       FROM usuarios
       WHERE usuario = :usuario AND password = :password`,
      {
        // Bind :usuario; evita inyeccion SQL porque no concatena texto.
        usuario: req.body.usuario,
        // Bind :password; compara contra la columna password.
        password: req.body.password
      }
    );

    // Si Oracle no devuelve filas, las credenciales no son validas.
    if (result.rows.length === 0) {
      // HTTP 401 significa no autorizado.
      return res.status(401).json({ message: 'Usuario o password incorrectos' });
    }

    // Si hay resultado, devuelve mensaje correcto y datos basicos del usuario.
    res.json({ message: 'Login correcto', usuario: result.rows[0] });
  } catch (error) {
    // Si ocurre un error, lo envia al middleware global de errores.
    next(error);
  }
});

// Exporta el router para montarlo en app.js.
module.exports = router;
