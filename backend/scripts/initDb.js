const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔄 Inicializando base de datos...');
    const sql = fs.readFileSync(path.join(__dirname, '../../sql/schema.sql'), 'utf-8');
    await client.query(sql);
    console.log('✅ Base de datos inicializada correctamente');
    console.log('📦 Tablas: ubicaciones, categorias, productos, stock, movimientos');
    console.log('🔢 Datos de ejemplo cargados');
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

initDb();
