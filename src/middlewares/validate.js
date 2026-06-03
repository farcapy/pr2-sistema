// Crea un middleware reutilizable para validar campos obligatorios.
function requireFields(fields) {
  // Devuelve una funcion middleware compatible con Express.
  return (req, res, next) => {
    // Recorre los campos requeridos y busca cuales faltan o estan vacios.
    const missing = fields.filter((field) => {
      // Lee el valor enviado en el cuerpo JSON.
      const value = req.body[field];
      // Considera faltante undefined, null o texto vacio.
      return value === undefined || value === null || String(value).trim() === '';
    });

    // Si hay campos faltantes, no deja continuar la peticion.
    if (missing.length > 0) {
      // Devuelve HTTP 400 porque el cliente envio datos incompletos.
      return res.status(400).json({
        // Informa exactamente que campos faltan.
        message: `Campos obligatorios faltantes: ${missing.join(', ')}`
      });
    }

    // Si todo esta correcto, pasa al siguiente middleware o controlador.
    next();
  };
}

// Exporta el middleware para usarlo en las rutas.
module.exports = { requireFields };
