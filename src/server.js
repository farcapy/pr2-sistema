const app = require('./app');
const { initPool, closePool } = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initPool();
    app.listen(PORT, () => {
      console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

start();
