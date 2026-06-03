const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function initPool() {
  await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1
  });
  console.log('Pool Oracle creado en modo Thin');
}

async function closePool() {
  const pool = oracledb.getPool();
  await pool.close(10);
}

async function execute(sql, binds = {}, options = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection();
    return await connection.execute(sql, binds, {
      autoCommit: false,
      ...options
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  oracledb,
  initPool,
  closePool,
  execute
};
