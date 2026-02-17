const express = require('express');
const router = express.Router();
const { query, pool } = require('../db');

// GET stock general (todos los productos x ubicación)
router.get('/', async (req, res) => {
  try {
    const { ubicacion_id, producto_id, bajo_minimo } = req.query;
    let sql = `
      SELECT s.id, s.cantidad, s.cantidad_minima, s.actualizado_en,
        p.id AS producto_id, p.codigo, p.nombre AS producto, p.unidad_medida, p.precio_costo,
        c.nombre AS categoria,
        u.id AS ubicacion_id, u.nombre AS ubicacion,
        CASE WHEN s.cantidad <= s.cantidad_minima THEN true ELSE false END AS stock_bajo
      FROM stock s
      JOIN productos p ON s.producto_id = p.id
      JOIN ubicaciones u ON s.ubicacion_id = u.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (ubicacion_id) { params.push(ubicacion_id); sql += ` AND s.ubicacion_id = $${params.length}`; }
    if (producto_id)  { params.push(producto_id);  sql += ` AND s.producto_id = $${params.length}`; }
    if (bajo_minimo === 'true') sql += ` AND s.cantidad <= s.cantidad_minima`;
    sql += ' ORDER BY u.nombre, p.nombre';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST ajustar stock (entrada/salida/ajuste)
router.post('/ajuste', async (req, res) => {
  const client = await pool.connect();
  try {
    const { producto_id, ubicacion_id, tipo, cantidad, motivo, usuario } = req.body;
    if (!['entrada', 'salida', 'ajuste'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido. Use: entrada, salida, ajuste' });
    }
    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    await client.query('BEGIN');

    // Obtener stock actual
    let stockRow = await client.query(
      'SELECT * FROM stock WHERE producto_id=$1 AND ubicacion_id=$2 FOR UPDATE',
      [producto_id, ubicacion_id]
    );

    let cantidadActual = 0;
    if (stockRow.rows.length) {
      cantidadActual = parseFloat(stockRow.rows[0].cantidad);
    } else {
      // Crear registro si no existe
      await client.query(
        'INSERT INTO stock (producto_id, ubicacion_id, cantidad) VALUES ($1,$2,0)',
        [producto_id, ubicacion_id]
      );
    }

    let nuevaCantidad;
    if (tipo === 'entrada')  nuevaCantidad = cantidadActual + parseFloat(cantidad);
    else if (tipo === 'salida') {
      nuevaCantidad = cantidadActual - parseFloat(cantidad);
      if (nuevaCantidad < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Stock insuficiente. Disponible: ${cantidadActual}` });
      }
    } else { // ajuste
      nuevaCantidad = parseFloat(cantidad);
    }

    // Actualizar stock
    await client.query(
      'UPDATE stock SET cantidad=$1 WHERE producto_id=$2 AND ubicacion_id=$3',
      [nuevaCantidad, producto_id, ubicacion_id]
    );

    // Registrar movimiento
    const mov = await client.query(
      `INSERT INTO movimientos (producto_id, ubicacion_id, tipo, cantidad, cantidad_anterior, cantidad_posterior, motivo, usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [producto_id, ubicacion_id, tipo, cantidad, cantidadActual, nuevaCantidad, motivo, usuario || 'admin']
    );

    await client.query('COMMIT');
    res.json({
      message: 'Stock actualizado correctamente',
      movimiento: mov.rows[0],
      cantidad_anterior: cantidadActual,
      cantidad_nueva: nuevaCantidad
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST transferencia entre ubicaciones
router.post('/transferencia', async (req, res) => {
  const client = await pool.connect();
  try {
    const { producto_id, ubicacion_origen_id, ubicacion_destino_id, cantidad, motivo, usuario } = req.body;
    if (ubicacion_origen_id === ubicacion_destino_id) {
      return res.status(400).json({ error: 'El origen y destino deben ser diferentes' });
    }

    await client.query('BEGIN');

    const origen = await client.query(
      'SELECT * FROM stock WHERE producto_id=$1 AND ubicacion_id=$2 FOR UPDATE',
      [producto_id, ubicacion_origen_id]
    );
    if (!origen.rows.length || parseFloat(origen.rows[0].cantidad) < parseFloat(cantidad)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stock insuficiente en origen' });
    }

    const cantOrigen = parseFloat(origen.rows[0].cantidad);
    const nuevaOrigen = cantOrigen - parseFloat(cantidad);

    await client.query(
      'UPDATE stock SET cantidad=$1 WHERE producto_id=$2 AND ubicacion_id=$3',
      [nuevaOrigen, producto_id, ubicacion_origen_id]
    );

    // Destino (crear si no existe)
    await client.query(
      `INSERT INTO stock (producto_id, ubicacion_id, cantidad) VALUES ($1,$2,$3)
       ON CONFLICT (producto_id, ubicacion_id) DO UPDATE SET cantidad = stock.cantidad + EXCLUDED.cantidad`,
      [producto_id, ubicacion_destino_id, cantidad]
    );

    // Registrar movimientos
    await client.query(
      `INSERT INTO movimientos (producto_id, ubicacion_id, tipo, cantidad, cantidad_anterior, cantidad_posterior, motivo, usuario)
       VALUES ($1,$2,'transferencia',$3,$4,$5,$6,$7)`,
      [producto_id, ubicacion_origen_id, cantidad, cantOrigen, nuevaOrigen, `Transferencia a ubicación ${ubicacion_destino_id}. ${motivo||''}`, usuario||'admin']
    );

    await client.query('COMMIT');
    res.json({ message: 'Transferencia realizada correctamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT actualizar stock mínimo
router.put('/minimo', async (req, res) => {
  try {
    const { producto_id, ubicacion_id, cantidad_minima } = req.body;
    await query(
      'UPDATE stock SET cantidad_minima=$1 WHERE producto_id=$2 AND ubicacion_id=$3',
      [cantidad_minima, producto_id, ubicacion_id]
    );
    res.json({ message: 'Stock mínimo actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
