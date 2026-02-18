const { Pool } = require('pg');
require('dotenv').config();

// En producción (Railway), usamos la DATABASE_URL proporcionada por el sistema.
// En local, podemos seguir usando los valores individuales o una URL local.
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL', err);
});

// Verificación de conexión para ver en los logs de Railway
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err.message);
  } else {
    console.log('✅ Base de datos conectada correctamente');
  }
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Query ejecutada', { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
};

module.exports = { pool, query };
