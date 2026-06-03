// Importa la aplicacion Express configurada en app.js.
const app = require('./app');
// Importa funciones para abrir y cerrar el pool Oracle.
const { initPool, closePool } = require('./config/database');
// Carga variables de entorno desde .env.
require('dotenv').config();

// Define el puerto desde .env o usa 3000 como valor por defecto.
const PORT = process.env.PORT || 3000;

// Funcion principal de arranque del backend.
async function start() {
  try {
    // Antes de escuchar peticiones, crea el pool de conexiones Oracle.
    await initPool();
    // Inicia el servidor HTTP de Express.
    app.listen(PORT, () => {
      // Mensaje visible cuando el servidor queda listo.
      console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
    });
  } catch (error) {
    // Si falla Oracle o Express, muestra el error en consola.
    console.error('No se pudo iniciar el servidor:', error);
    // Termina el proceso con codigo de error.
    process.exit(1);
  }
}

// Captura Ctrl+C para cerrar Oracle correctamente antes de salir.
process.on('SIGINT', async () => {
  // Cierra el pool de conexiones.
  await closePool();
  // Finaliza el proceso Node.
  process.exit(0);
});

// Ejecuta la funcion principal.
start();
