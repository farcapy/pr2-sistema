// Importa la libreria oficial para conectarse a Oracle desde Node.js.
const oracledb = require('oracledb');
// Carga las variables del archivo .env, por ejemplo usuario, password y cadena de conexion.
require('dotenv').config();

// Configura Oracle para devolver filas como objetos en vez de arreglos.
// Ejemplo: { id_usuario: 1 } en lugar de [1].
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Inicializa el pool de conexiones a Oracle.
// Un pool mantiene conexiones abiertas y reutilizables para mejorar rendimiento.
async function initPool() {
  // createPool trabaja en modo Thin porque no se llama a initOracleClient().
  await oracledb.createPool({
    // Usuario Oracle leido desde .env.
    user: process.env.ORACLE_USER,
    // Password Oracle leido desde .env.
    password: process.env.ORACLE_PASSWORD,
    // Servicio Oracle, en este proyecto localhost:1521/XEPDB1.
    connectString: process.env.ORACLE_CONNECT_STRING,
    // Cantidad minima de conexiones abiertas.
    poolMin: 1,
    // Cantidad maxima de conexiones simultaneas.
    poolMax: 5,
    // Cantidad de conexiones que Oracle agrega cuando hacen falta mas.
    poolIncrement: 1
  });
  // Mensaje de confirmacion para saber que la conexion quedo lista.
  console.log('Pool Oracle creado en modo Thin');
}

// Cierra el pool de conexiones cuando el servidor se apaga.
async function closePool() {
  // Obtiene el pool creado previamente con createPool().
  const pool = oracledb.getPool();
  // Espera hasta 10 segundos para cerrar conexiones activas correctamente.
  await pool.close(10);
}

// Funcion auxiliar para ejecutar consultas SQL simples.
// Recibe el SQL, los parametros bind y opciones adicionales.
async function execute(sql, binds = {}, options = {}) {
  // Declara la conexion fuera del try para poder cerrarla en finally.
  let connection;
  try {
    // Toma una conexion disponible desde el pool.
    connection = await oracledb.getConnection();
    // Ejecuta la sentencia SQL usando binds para evitar concatenar valores.
    return await connection.execute(sql, binds, {
      // Por defecto no confirma automaticamente, salvo que una ruta lo indique.
      autoCommit: false,
      // Permite sobrescribir opciones, por ejemplo autoCommit: true.
      ...options
    });
  } finally {
    // finally se ejecuta aunque haya error, por eso asegura liberar la conexion.
    if (connection) {
      // Devuelve la conexion al pool para que pueda reutilizarse.
      await connection.close();
    }
  }
}

// Exporta funciones y objeto oracledb para ser usados por las rutas.
module.exports = {
  // Se exporta oracledb para rutas que necesitan transacciones manuales.
  oracledb,
  // Se exporta la inicializacion del pool para server.js.
  initPool,
  // Se exporta el cierre del pool para apagado ordenado.
  closePool,
  // Se exporta el helper de consultas para rutas simples.
  execute
};
