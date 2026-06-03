const express = require('express');
const { execute } = require('../config/database');
const { requireFields } = require('../middlewares/validate');

const router = express.Router();

router.post('/', requireFields(['usuario', 'password']), async (req, res, next) => {
  try {
    const result = await execute(
      `SELECT id_usuario "id_usuario", usuario "usuario", nombre "nombre", rol "rol"
       FROM usuarios
       WHERE usuario = :usuario AND password = :password`,
      {
        usuario: req.body.usuario,
        password: req.body.password
      }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o password incorrectos' });
    }

    res.json({ message: 'Login correcto', usuario: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
